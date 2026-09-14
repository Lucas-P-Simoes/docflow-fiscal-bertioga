import {
  createProcessGuide,
  deleteProcessGuide,
  listProcessGuides,
  updateProcessGuide,
  type ProcessGuideInput,
  type ProcessGuideLink,
} from "../db/processes";
import { authenticateRequest, authError, authJson } from "./auth";
import { ADMIN_EMAIL } from "./constants";

const MAX_PROCESS_BODY_BYTES = 48 * 1024;
const MAX_CHECKLIST_ITEMS = 40;
const MAX_LINKS = 20;

type AuthenticatedAccount = NonNullable<Awaited<ReturnType<typeof authenticateRequest>>>;

export async function handleProcesses(request: Request, env: Env): Promise<Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");

  if (request.method === "GET") {
    const processes = await listProcessGuides(env.DB, Math.floor(Date.now() / 1000));
    return authJson(200, { processes });
  }
  if (request.method !== "POST") return authError(405, "Método não permitido.");
  if (!isAdministrator(authenticated)) return authError(403, "Somente o administrador pode cadastrar processos.");

  const body = await readProcessBody(request);
  if (body instanceof Response) return body;
  const process = await createProcessGuide(env.DB, {
    ...body,
    id: crypto.randomUUID(),
    userId: authenticated.account.id,
    now: Math.floor(Date.now() / 1000),
  });
  return authJson(201, { process });
}

export async function handleProcessMutation(
  request: Request,
  env: Env,
  processId: string,
): Promise<Response> {
  if (request.method !== "PATCH" && request.method !== "DELETE") {
    return authError(405, "Método não permitido.");
  }
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");
  if (!isAdministrator(authenticated)) return authError(403, "Somente o administrador pode alterar processos.");

  if (request.method === "DELETE") {
    if (!(await deleteProcessGuide(env.DB, processId))) {
      return authError(404, "Processo não encontrado.");
    }
    return authJson(200, { deleted: true, id: processId });
  }

  const body = await readProcessBody(request);
  if (body instanceof Response) return body;
  const process = await updateProcessGuide(env.DB, {
    ...body,
    id: processId,
    userId: authenticated.account.id,
    now: Math.floor(Date.now() / 1000),
  });
  if (!process) return authError(404, "Processo não encontrado.");
  return authJson(200, { process });
}

function isAdministrator(authenticated: AuthenticatedAccount): boolean {
  return authenticated.account.isAdmin && authenticated.account.email === ADMIN_EMAIL;
}

async function readProcessBody(request: Request): Promise<ProcessGuideInput | Response> {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_PROCESS_BODY_BYTES) {
    return authError(413, "O conteúdo do processo é maior que o limite permitido.");
  }

  let value: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_PROCESS_BODY_BYTES) {
      return authError(413, "O conteúdo do processo é maior que o limite permitido.");
    }
    value = JSON.parse(text);
  } catch {
    return authError(400, "Informe os dados do processo corretamente.");
  }
  if (!isObject(value)) return authError(400, "Informe os dados do processo corretamente.");

  const title = cleanText(value.title, 120);
  const summary = cleanText(value.summary, 600);
  const checklist = cleanChecklist(value.checklist);
  const links = cleanLinks(value.links);
  if (title.length < 2) return authError(400, "Informe o nome do processo.");
  if (summary.length < 10) return authError(400, "Informe um resumo para orientar a equipe.");
  if (!checklist) return authError(400, `Informe de 1 a ${MAX_CHECKLIST_ITEMS} documentos ou orientações.`);
  if (!links) return authError(400, "Revise os links úteis informados.");
  return { title, summary, checklist, links };
}

function cleanChecklist(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > MAX_CHECKLIST_ITEMS) return null;
  const items = value.map((item) => cleanText(item, 500)).filter(Boolean);
  return items.length === value.length ? items : null;
}

function cleanLinks(value: unknown): ProcessGuideLink[] | null {
  if (!Array.isArray(value) || value.length > MAX_LINKS) return null;
  const links: ProcessGuideLink[] = [];
  for (const item of value) {
    if (!isObject(item)) return null;
    const label = cleanText(item.label, 120);
    const rawUrl = typeof item.url === "string" ? item.url.trim().slice(0, 1_000) : "";
    if (!label || !rawUrl) return null;
    try {
      const url = new URL(rawUrl);
      if (url.protocol !== "https:" && url.protocol !== "http:") return null;
      links.push({ label, url: url.href });
    } catch {
      return null;
    }
  }
  return links;
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
