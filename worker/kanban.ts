import {
  createKanbanCard,
  deleteKanbanCard,
  listApprovedKanbanPeople,
  listKanbanCards,
  listKanbanNotifications,
  markAllKanbanNotificationsRead,
  markKanbanNotificationRead,
  updateKanbanCard,
  type KanbanPerson,
  type KanbanStatus,
} from "../db/kanban";
import { authenticateRequest, authError, authJson } from "./auth";

const MAX_KANBAN_BODY_BYTES = 24 * 1024;
const MAX_ASSIGNEES = 20;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KANBAN_STATUSES = new Set<KanbanStatus>(["todo", "doing", "done"]);

type JsonObject = Record<string, unknown>;
type Authenticated = NonNullable<Awaited<ReturnType<typeof authenticateRequest>>>;

export async function handleKanban(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;

  const [cards, people] = await Promise.all([
    listKanbanCards(env.DB),
    listApprovedKanbanPeople(env.DB),
  ]);
  return authJson(200, { cards, people });
}

export async function handleKanbanCards(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;

  const parsed = await parseCardBody(request, env.DB);
  if (parsed instanceof Response) return parsed;
  const now = unixNow();
  const card = await createKanbanCard(env.DB, {
    id: crypto.randomUUID(),
    ...parsed,
    actor: accountPerson(authenticated),
    now,
  });
  return authJson(201, { card });
}

export async function handleKanbanCardMutation(
  request: Request,
  env: Env,
  cardId: string,
): Promise<Response> {
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;

  if (request.method === "DELETE") {
    if (!(await deleteKanbanCard(env.DB, cardId))) {
      return authError(404, "Cartão não encontrado.");
    }
    return authJson(200, { deleted: true, id: cardId });
  }
  if (request.method !== "PATCH") return authError(405, "Método não permitido.");

  const parsed = await parseCardBody(request, env.DB);
  if (parsed instanceof Response) return parsed;
  const card = await updateKanbanCard(env.DB, {
    id: cardId,
    ...parsed,
    actor: accountPerson(authenticated),
    now: unixNow(),
  });
  if (!card) return authError(404, "Cartão não encontrado.");
  return authJson(200, { card });
}

export async function handleKanbanNotifications(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "GET") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  return authJson(200, await listKanbanNotifications(env.DB, authenticated.account.id));
}

export async function handleKanbanNotificationMutation(
  request: Request,
  env: Env,
  notificationId: string,
): Promise<Response> {
  if (request.method !== "PATCH") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  const updated = await markKanbanNotificationRead(
    env.DB,
    authenticated.account.id,
    notificationId,
    unixNow(),
  );
  if (!updated) return authError(404, "Notificação não encontrada.");
  return authJson(200, { read: true, id: notificationId });
}

export async function handleKanbanNotificationsRead(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  await markAllKanbanNotificationsRead(env.DB, authenticated.account.id, unixNow());
  return authJson(200, { read: true });
}

async function requireKanbanAccount(
  request: Request,
  env: Env,
): Promise<Authenticated | Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");
  return authenticated;
}

async function parseCardBody(
  request: Request,
  db: D1Database,
): Promise<{
  title: string;
  description: string;
  status: KanbanStatus;
  assigneeIds: string[];
} | Response> {
  let body: JsonObject;
  try {
    body = await readKanbanBody(request);
  } catch (error) {
    return authError(400, error instanceof Error ? error.message : "Dados inválidos.");
  }

  const title = cleanSingleLine(body.title, 160);
  const description = cleanMultiline(body.description, 2_000);
  const status = body.status;
  if (!title) return authError(400, "Informe o título do cartão.");
  if (typeof status !== "string" || !KANBAN_STATUSES.has(status as KanbanStatus)) {
    return authError(400, "Escolha uma coluna válida para o cartão.");
  }
  if (!Array.isArray(body.assigneeIds)) {
    return authError(400, "Informe os responsáveis no formato correto.");
  }

  const assigneeIds = [...new Set(
    body.assigneeIds.filter((value): value is string => typeof value === "string"),
  )];
  if (assigneeIds.length > MAX_ASSIGNEES || assigneeIds.some((id) => !UUID_PATTERN.test(id))) {
    return authError(400, "A lista de responsáveis é inválida.");
  }
  const approvedIds = new Set((await listApprovedKanbanPeople(db)).map((item) => item.id));
  if (assigneeIds.some((id) => !approvedIds.has(id))) {
    return authError(400, "Selecione somente pessoas com acesso aprovado ao sistema.");
  }

  return { title, description, status: status as KanbanStatus, assigneeIds };
}

async function readKanbanBody(request: Request): Promise<JsonObject> {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_KANBAN_BODY_BYTES) throw new Error("Solicitação muito grande.");
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    throw new Error("Envie os dados no formato correto.");
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_KANBAN_BODY_BYTES) throw new Error("Solicitação muito grande.");
  const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Dados inválidos.");
  }
  return parsed as JsonObject;
}

function cleanSingleLine(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim().slice(0, maxLength) : "";
}

function cleanMultiline(value: unknown, maxLength: number): string {
  return typeof value === "string"
    ? value.replace(/\r\n?/g, "\n").replace(/[\t ]+\n/g, "\n").trim().slice(0, maxLength)
    : "";
}

function accountPerson(authenticated: Authenticated): KanbanPerson {
  return {
    id: authenticated.account.id,
    name: authenticated.account.name,
    email: authenticated.account.email,
  };
}

function unixNow(): number {
  return Math.floor(Date.now() / 1_000);
}
