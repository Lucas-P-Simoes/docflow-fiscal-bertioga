import {
  createKanbanBoard,
  createKanbanCard,
  deleteKanbanBoard,
  deleteKanbanCard,
  getKanbanBoard,
  getKanbanCardAccess,
  listAccessibleKanbanBoards,
  listApprovedKanbanPeople,
  listKanbanActivity,
  listKanbanCards,
  listKanbanNotifications,
  markAllKanbanNotificationsRead,
  markKanbanNotificationRead,
  updateKanbanBoard,
  updateKanbanCard,
  type KanbanPerson,
  type KanbanStatus,
} from "../db/kanban";
import { authenticateRequest, authError, authJson } from "./auth";

const MAX_KANBAN_BODY_BYTES = 48 * 1024;
const MAX_ASSIGNEES = 30;
const MAX_BOARD_MEMBERS = 40;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const KANBAN_STATUSES = new Set<KanbanStatus>(["todo", "doing", "done"]);

type JsonObject = Record<string, unknown>;
type Authenticated = NonNullable<Awaited<ReturnType<typeof authenticateRequest>>>;

export async function handleKanban(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;

  const userId = authenticated.account.id;
  const requestedBoardId = new URL(request.url).searchParams.get("boardId")?.trim() || "";
  if (requestedBoardId && !UUID_PATTERN.test(requestedBoardId)) {
    return authError(400, "Quadro inválido.");
  }

  const [boards, people] = await Promise.all([
    listAccessibleKanbanBoards(env.DB, userId),
    listApprovedKanbanPeople(env.DB),
  ]);
  const selectedId = requestedBoardId || boards[0]?.id || "";
  if (!selectedId) return authJson(200, { boards, board: null, cards: [], activity: [], people });
  if (!boards.some((board) => board.id === selectedId)) {
    return authError(404, "Quadro não encontrado ou sem acesso.");
  }

  const [board, cards, activity] = await Promise.all([
    getKanbanBoard(env.DB, selectedId, userId),
    listKanbanCards(env.DB, selectedId),
    listKanbanActivity(env.DB, selectedId),
  ]);
  if (!board) return authError(404, "Quadro não encontrado ou sem acesso.");
  return authJson(200, { boards, board, cards, activity, people });
}

export async function handleKanbanBoards(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  const body = await readBodyOrResponse(request);
  if (body instanceof Response) return body;
  const parsed = await parseBoardBody(body, env.DB);
  if (parsed instanceof Response) return parsed;

  const board = await createKanbanBoard(env.DB, {
    id: crypto.randomUUID(),
    ...parsed,
    actor: accountPerson(authenticated),
    now: unixNow(),
  });
  return authJson(201, { board });
}

export async function handleKanbanBoardMutation(
  request: Request,
  env: Env,
  boardId: string,
): Promise<Response> {
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  const board = await getKanbanBoard(env.DB, boardId, authenticated.account.id);
  if (!board) return authError(404, "Quadro não encontrado ou sem acesso.");
  if (!board.isOwner) return authError(403, "Somente o criador pode gerenciar este quadro.");

  if (request.method === "DELETE") {
    const deleted = await deleteKanbanBoard(env.DB, boardId, authenticated.account.id);
    if (!deleted) return authError(404, "Quadro não encontrado.");
    return authJson(200, { deleted: true, id: boardId });
  }
  if (request.method !== "PATCH") return authError(405, "Método não permitido.");

  const body = await readBodyOrResponse(request);
  if (body instanceof Response) return body;
  const parsed = await parseBoardBody(body, env.DB);
  if (parsed instanceof Response) return parsed;
  const updated = await updateKanbanBoard(env.DB, {
    id: boardId,
    ...parsed,
    actor: accountPerson(authenticated),
    now: unixNow(),
  });
  if (!updated) return authError(404, "Quadro não encontrado.");
  return authJson(200, { board: updated });
}

export async function handleKanbanCards(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  const body = await readBodyOrResponse(request);
  if (body instanceof Response) return body;
  const boardId = cleanSingleLine(body.boardId, 64);
  if (!UUID_PATTERN.test(boardId)) return authError(400, "Selecione um quadro válido.");

  const board = await getKanbanBoard(env.DB, boardId, authenticated.account.id);
  if (!board) return authError(404, "Quadro não encontrado ou sem acesso.");
  if (!board.canEdit) return authError(403, "Você não tem permissão para editar este quadro.");
  const parsed = parseCardBody(body, new Set(board.members.map((item) => item.id)));
  if (parsed instanceof Response) return parsed;

  const card = await createKanbanCard(env.DB, {
    id: crypto.randomUUID(),
    boardId,
    ...parsed,
    actor: accountPerson(authenticated),
    now: unixNow(),
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
  const access = await getKanbanCardAccess(env.DB, cardId, authenticated.account.id);
  if (!access) return authError(404, "Cartão não encontrado ou sem acesso.");
  if (!access.canEdit) return authError(403, "Você não tem permissão para editar este cartão.");

  if (request.method === "DELETE") {
    const deleted = await deleteKanbanCard(env.DB, {
      cardId,
      boardId: access.boardId,
      actor: accountPerson(authenticated),
      now: unixNow(),
    });
    if (!deleted) return authError(404, "Cartão não encontrado.");
    return authJson(200, { deleted: true, id: cardId });
  }
  if (request.method !== "PATCH") return authError(405, "Método não permitido.");

  const board = await getKanbanBoard(env.DB, access.boardId, authenticated.account.id);
  if (!board) return authError(404, "Quadro não encontrado ou sem acesso.");
  const body = await readBodyOrResponse(request);
  if (body instanceof Response) return body;
  const parsed = parseCardBody(body, new Set(board.members.map((item) => item.id)));
  if (parsed instanceof Response) return parsed;
  const card = await updateKanbanCard(env.DB, {
    id: cardId,
    boardId: access.boardId,
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

async function parseBoardBody(
  body: JsonObject,
  db: D1Database,
): Promise<{ name: string; description: string; memberIds: string[] } | Response> {
  const name = cleanSingleLine(body.name, 100);
  const description = cleanMultiline(body.description, 600);
  if (!name) return authError(400, "Informe o nome do quadro.");
  if (!Array.isArray(body.memberIds)) {
    return authError(400, "Informe os participantes no formato correto.");
  }
  const memberIds = uniqueUuidList(body.memberIds);
  if (!memberIds || memberIds.length > MAX_BOARD_MEMBERS) {
    return authError(400, "A lista de participantes é inválida.");
  }
  const approvedIds = new Set((await listApprovedKanbanPeople(db)).map((item) => item.id));
  if (memberIds.some((id) => !approvedIds.has(id))) {
    return authError(400, "Selecione somente pessoas com acesso aprovado ao sistema.");
  }
  return { name, description, memberIds };
}

function parseCardBody(
  body: JsonObject,
  allowedMemberIds: Set<string>,
): {
  title: string;
  description: string;
  status: KanbanStatus;
  assigneeIds: string[];
} | Response {
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

  const assigneeIds = uniqueUuidList(body.assigneeIds);
  if (!assigneeIds || assigneeIds.length > MAX_ASSIGNEES) {
    return authError(400, "A lista de responsáveis é inválida.");
  }
  if (assigneeIds.some((id) => !allowedMemberIds.has(id))) {
    return authError(400, "Selecione somente participantes deste quadro.");
  }

  return { title, description, status: status as KanbanStatus, assigneeIds };
}

async function readBodyOrResponse(request: Request): Promise<JsonObject | Response> {
  try {
    return await readKanbanBody(request);
  } catch (error) {
    return authError(400, error instanceof Error ? error.message : "Dados inválidos.");
  }
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

function uniqueUuidList(values: unknown[]): string[] | null {
  const ids = [...new Set(values.filter((value): value is string => typeof value === "string"))];
  return ids.some((id) => !UUID_PATTERN.test(id)) ? null : ids;
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
