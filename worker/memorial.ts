import { authenticateRequest, authError, canAccountUseAI } from "./auth";

const MEMORIAL_CRITERIA_OBJECT_KEY = "reference-data/memorial/criterios-medicao-cdhu-v200.json";
const MAX_REQUEST_BYTES = 512 * 1024;
const MAX_ITEMS_PER_REQUEST = 200;

type CriteriaPage = {
  page: string;
  text: string;
  compact: string;
};

type MemorialItem = {
  sequence: string;
  itemNumber: string;
  referenceCode: string;
  description: string;
};

type CriteriaMatch = {
  pages: Array<{ page: string; text: string }>;
  method: "code" | "description" | "none";
  matchedCode: string;
  score: number;
  measurement: string;
  compensation: string;
};

let criteriaPagesPromise: Promise<CriteriaPage[]> | null = null;

function normalizeSearchText(value: unknown, compact = false): string {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^a-z0-9]+/g, compact ? "" : " ")
    .trim();
  return compact ? normalized : normalized.replace(/\s+/g, " ");
}

function referenceCode(item: MemorialItem): string {
  if (item.referenceCode) return normalizeSearchText(item.referenceCode, true);
  const match = `${item.itemNumber} ${item.description}`.match(/\b\d{1,2}[.\s-]\d{2}[.\s-]\d{3}\b/);
  return match ? normalizeSearchText(match[0], true) : "";
}

function descriptionTerms(description: string): string[] {
  const ignored = new Set([
    "para",
    "com",
    "sem",
    "tipo",
    "sobre",
    "entre",
    "pela",
    "pelo",
    "incluindo",
    "inclusive",
    "fornecimento",
    "execucao",
  ]);
  return [...new Set(normalizeSearchText(description).split(" "))]
    .filter((term) => term.length >= 4 && !ignored.has(term));
}

function cleanCriterionParagraph(value: string, kind: "measurement" | "compensation"): string {
  const withoutPageMarkers = value.replace(/\[\[PAGE:[^\]]+\]\]/g, " ").replace(/\s+/g, " ").trim();
  if (kind === "measurement") {
    return withoutPageMarkers.replace(/^ser[aá]\s+medido\s+por\s*/i, "").trim();
  }
  return withoutPageMarkers.replace(/^o\s+item\s+remunera\s*/i, "").trim();
}

function exactCodeBlock(item: MemorialItem, pages: CriteriaPage[]): CriteriaMatch | null {
  const code = referenceCode(item);
  if (code.length < 6) return null;
  const firstPageIndex = pages.findIndex((page) => page.compact.includes(code));
  if (firstPageIndex < 0) return null;

  const windowPages = pages.slice(firstPageIndex, firstPageIndex + 4);
  const joined = windowPages.map((page) => `[[PAGE:${page.page}]]\n${page.text}`).join("\n");
  const serviceCodePattern = /\b\d{1,2}\s*[.\s-]\s*\d{2}\s*[.\s-]\s*\d{3}\b/g;
  const matches = [...joined.matchAll(serviceCodePattern)];
  const startMatchIndex = matches.findIndex((match) => normalizeSearchText(match[0], true) === code);
  if (startMatchIndex < 0) return null;

  const startMatch = matches[startMatchIndex];
  const start = startMatch.index || 0;
  const nextMatch = matches.slice(startMatchIndex + 1).find((match) => normalizeSearchText(match[0], true) !== code);
  const end = nextMatch?.index ?? joined.length;
  const block = joined.slice(start, end);
  const measurementMatch = block.match(/1\s*\)\s*([\s\S]*?)(?=2\s*\)\s*(?:o\s+item\s+remunera)?)/i);
  const compensationMatch = block.match(/2\s*\)\s*([\s\S]*)/i);
  const measurement = measurementMatch ? cleanCriterionParagraph(measurementMatch[1], "measurement") : "";
  const compensation = compensationMatch ? cleanCriterionParagraph(compensationMatch[1], "compensation") : "";
  const usedPages = [...block.matchAll(/\[\[PAGE:([^\]]+)\]\]/g)].map((match) => match[1]);
  if (!usedPages.includes(windowPages[0].page)) usedPages.unshift(windowPages[0].page);
  const pageLabel = [...new Set(usedPages)].join(", ");
  const excerpt = block.replace(/\[\[PAGE:[^\]]+\]\]/g, " ").replace(/\s+/g, " ").trim();

  return {
    pages: [{ page: pageLabel, text: excerpt }],
    method: "code",
    matchedCode: item.referenceCode || code,
    score: 200,
    measurement,
    compensation,
  };
}

async function loadCriteriaPages(env: Env): Promise<CriteriaPage[]> {
  if (!criteriaPagesPromise) {
    criteriaPagesPromise = env.DOCUMENTS.get(MEMORIAL_CRITERIA_OBJECT_KEY)
      .then(async (object) => {
        if (!object) throw new Error("Base privada de critérios não encontrada.");
        const parsed: unknown = JSON.parse(await object.text());
        if (!Array.isArray(parsed) || !parsed.length) {
          throw new Error("Base privada de critérios vazia.");
        }
        return parsed.map((value) => {
          const page = value && typeof value === "object" ? value as Record<string, unknown> : {};
          const text = String(page.text || "");
          return {
            page: String(page.page || ""),
            text,
            compact: normalizeSearchText(text, true),
          };
        });
      })
      .catch((error) => {
        criteriaPagesPromise = null;
        throw error;
      });
  }
  return criteriaPagesPromise;
}

function criteriaPagesForItem(item: MemorialItem, pages: CriteriaPage[]): CriteriaMatch {
  const exact = exactCodeBlock(item, pages);
  if (exact) return exact;

  const code = referenceCode(item);
  const descriptionCompact = normalizeSearchText(item.description, true);
  const terms = descriptionTerms(item.description);
  const ranked: Array<{ page: CriteriaPage; index: number; score: number }> = [];

  pages.forEach((page, index) => {
    let score = 0;
    if (code.length >= 6 && page.compact.includes(code)) score += 200;
    if (descriptionCompact.length >= 12 && page.compact.includes(descriptionCompact)) score += 150;
    if (terms.length) {
      const matched = terms.filter((term) => page.compact.includes(term));
      score += (matched.length / terms.length) * 100;
      score += matched.reduce((total, term) => total + Math.min(12, term.length), 0) / 10;
    }
    if (score >= 42) ranked.push({ page, index, score });
  });

  ranked.sort((left, right) => right.score - left.score || left.index - right.index);
  const selected: CriteriaPage[] = [];
  const seen = new Set<number>();
  const addPage = (index: number) => {
    const page = pages[index];
    if (!page || seen.has(index) || selected.length >= 3) return;
    seen.add(index);
    selected.push(page);
  };

  ranked.slice(0, 2).forEach((match) => {
    addPage(match.index);
    if (!match.page.compact.includes("1)seramedido") && !match.page.compact.includes("1seramedido")) {
      addPage(match.index - 1);
    }
    if (!match.page.compact.includes("2)oitemremunera") && !match.page.compact.includes("2oitemremunera")) {
      addPage(match.index + 1);
    }
  });

  const sorted = selected.sort((left, right) => Number(left.page) - Number(right.page));
  return {
    pages: sorted.map((page) => ({ page: page.page, text: page.text })),
    method: sorted.length ? "description" : "none",
    matchedCode: code,
    score: ranked[0]?.score || 0,
    measurement: "",
    compensation: "",
  };
}

function cleanItem(value: unknown, index: number): MemorialItem {
  const item = value && typeof value === "object" ? value as Record<string, unknown> : {};
  return {
    sequence: String(item.sequence || index + 1).slice(0, 40).trim(),
    itemNumber: String(item.itemNumber || "").slice(0, 80).trim(),
    referenceCode: String(item.referenceCode || "").slice(0, 120).trim(),
    description: String(item.description || "").replace(/\s+/g, " ").slice(0, 1500).trim(),
  };
}

export async function handleMemorialCriteria(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");

  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");
  if (!canAccountUseAI(authenticated.account)) {
    return authError(403, "O administrador ainda não liberou o uso da IA para esta conta.");
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) return authError(413, "A consulta de critérios é muito grande.");

  let parsed: unknown;
  try {
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > MAX_REQUEST_BYTES) return authError(413, "A consulta de critérios é muito grande.");
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return authError(400, "Consulta de critérios inválida.");
  }

  const rawItems = parsed && typeof parsed === "object"
    ? (parsed as Record<string, unknown>).items
    : null;
  if (!Array.isArray(rawItems) || !rawItems.length || rawItems.length > MAX_ITEMS_PER_REQUEST) {
    return authError(400, `Envie de 1 a ${MAX_ITEMS_PER_REQUEST} itens por consulta.`);
  }

  try {
    const items = rawItems.map(cleanItem);
    const pages = await loadCriteriaPages(env);
    const contexts = items.map((item) => {
      const match = criteriaPagesForItem(item, pages);
      return {
        sequence: item.sequence,
        pages: match.pages,
        match: {
          method: match.method,
          code: match.matchedCode,
          pages: [...new Set(match.pages.flatMap((page) => page.page.split(",").map((value) => value.trim()).filter(Boolean)))],
          score: Math.round(match.score),
        },
        directCriteria: {
          measurement: match.measurement,
          compensation: match.compensation,
        },
      };
    });
    return Response.json({ contexts }, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return authError(503, "A base privada de critérios técnicos ainda não está disponível.");
  }
}
