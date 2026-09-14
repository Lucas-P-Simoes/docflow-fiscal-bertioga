export type ProcessGuideLink = {
  label: string;
  url: string;
};

export type ProcessGuide = {
  id: string;
  title: string;
  summary: string;
  checklist: string[];
  links: ProcessGuideLink[];
  createdAt: number;
  updatedAt: number;
};

export type ProcessGuideInput = Pick<ProcessGuide, "title" | "summary" | "checklist" | "links">;

type ProcessGuideRow = {
  id: string;
  title: string;
  summary: string;
  checklist_json: string;
  links_json: string;
  created_at: number;
  updated_at: number;
};

const INITIAL_GUIDE_SEED = "process-guides-v1";
const INITIAL_GUIDE_ID = "593d2191-840d-4f24-9a50-8cc3a3a3c216";
const INITIAL_GUIDE: ProcessGuideInput = {
  title: "Aditivo de prazo",
  summary: "Documentação e justificativas recomendadas para solicitar a prorrogação do prazo contratual.",
  checklist: [
    "Anexar imagem da página do SP Águas mostrando o índice pluviométrico a partir de 13/08/2026.",
    "Apresentar justificativa técnica: o contrato foi assinado em 29/07/2026, porém a Ordem de Serviço foi assinada somente em 13/08/2026, reduzindo o período disponível para a execução dos serviços.",
    "Anexar Certidão de Regularidade Federal vigente.",
    "Anexar Certidão de Regularidade Estadual vigente, incluindo a consulta à Dívida Ativa do Estado de São Paulo.",
    "Anexar Certidão de Regularidade Municipal vigente.",
  ],
  links: [
    {
      label: "Índice pluviométrico — SP Águas",
      url: "https://apps.spaguas.sp.gov.br/sibh/graficos?station_type=plu",
    },
    {
      label: "Certidão de Regularidade Federal",
      url: "https://servicos.receitafederal.gov.br/servico/certidoes/#/home/cnpj/resultado",
    },
    {
      label: "Certidão de Regularidade Estadual",
      url: "https://www10.fazenda.sp.gov.br/CertidaoNegativaDeb/Pages/EmissaoCertidaoNegativa.aspx",
    },
    {
      label: "Dívida Ativa do Estado de São Paulo",
      url: "https://www.dividaativa.pge.sp.gov.br/sc/loginIdpGovBr.jsf",
    },
  ],
};

function processGuide(row: ProcessGuideRow): ProcessGuide {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    checklist: parseChecklist(row.checklist_json),
    links: parseLinks(row.links_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseChecklist(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseLinks(value: string): ProcessGuideLink[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ProcessGuideLink =>
        Boolean(item) &&
        typeof item === "object" &&
        typeof (item as ProcessGuideLink).label === "string" &&
        typeof (item as ProcessGuideLink).url === "string",
    );
  } catch {
    return [];
  }
}

async function ensureInitialProcessGuide(db: D1Database, now: number): Promise<void> {
  const seeded = await db
    .prepare("SELECT id FROM content_seeds WHERE id = ? LIMIT 1")
    .bind(INITIAL_GUIDE_SEED)
    .first<{ id: string }>();
  if (seeded) return;

  await db.batch([
    db
      .prepare(
        `INSERT OR IGNORE INTO process_guides (
           id, title, summary, checklist_json, links_json,
           created_by, updated_by, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, ?)`,
      )
      .bind(
        INITIAL_GUIDE_ID,
        INITIAL_GUIDE.title,
        INITIAL_GUIDE.summary,
        JSON.stringify(INITIAL_GUIDE.checklist),
        JSON.stringify(INITIAL_GUIDE.links),
        now,
        now,
      ),
    db
      .prepare("INSERT OR IGNORE INTO content_seeds (id, applied_at) VALUES (?, ?)")
      .bind(INITIAL_GUIDE_SEED, now),
  ]);
}

export async function listProcessGuides(db: D1Database, now: number): Promise<ProcessGuide[]> {
  await ensureInitialProcessGuide(db, now);
  const result = await db
    .prepare(
      `SELECT id, title, summary, checklist_json, links_json, created_at, updated_at
       FROM process_guides
       ORDER BY updated_at DESC, title COLLATE NOCASE ASC`,
    )
    .all<ProcessGuideRow>();
  return result.results.map(processGuide);
}

export async function createProcessGuide(
  db: D1Database,
  values: ProcessGuideInput & { id: string; userId: string; now: number },
): Promise<ProcessGuide> {
  await db
    .prepare(
      `INSERT INTO process_guides (
         id, title, summary, checklist_json, links_json,
         created_by, updated_by, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      values.id,
      values.title,
      values.summary,
      JSON.stringify(values.checklist),
      JSON.stringify(values.links),
      values.userId,
      values.userId,
      values.now,
      values.now,
    )
    .run();
  return {
    id: values.id,
    title: values.title,
    summary: values.summary,
    checklist: values.checklist,
    links: values.links,
    createdAt: values.now,
    updatedAt: values.now,
  };
}

export async function updateProcessGuide(
  db: D1Database,
  values: ProcessGuideInput & { id: string; userId: string; now: number },
): Promise<ProcessGuide | null> {
  const existing = await db
    .prepare("SELECT created_at FROM process_guides WHERE id = ? LIMIT 1")
    .bind(values.id)
    .first<{ created_at: number }>();
  if (!existing) return null;

  const result = await db
    .prepare(
      `UPDATE process_guides
       SET title = ?, summary = ?, checklist_json = ?, links_json = ?, updated_by = ?, updated_at = ?
       WHERE id = ?`,
    )
    .bind(
      values.title,
      values.summary,
      JSON.stringify(values.checklist),
      JSON.stringify(values.links),
      values.userId,
      values.now,
      values.id,
    )
    .run();
  if (result.meta.changes < 1) return null;
  return {
    id: values.id,
    title: values.title,
    summary: values.summary,
    checklist: values.checklist,
    links: values.links,
    createdAt: existing.created_at,
    updatedAt: values.now,
  };
}

export async function deleteProcessGuide(db: D1Database, guideId: string): Promise<boolean> {
  const result = await db.prepare("DELETE FROM process_guides WHERE id = ?").bind(guideId).run();
  return result.meta.changes > 0;
}
