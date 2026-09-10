import {
  countKanbanCardAttachments,
  createKanbanBoard,
  createKanbanCard,
  createKanbanCardAttachments,
  createKanbanCardComment,
  deleteKanbanBoard,
  deleteKanbanCard,
  deleteKanbanCardAttachment,
  getKanbanBoard,
  getKanbanCardAttachment,
  getKanbanCardAccess,
  listAccessibleKanbanBoards,
  listApprovedKanbanPeople,
  listKanbanAttachmentKeysForBoard,
  listKanbanAttachmentKeysForCard,
  listKanbanActivity,
  listKanbanCardActivity,
  listKanbanCardAttachments,
  listKanbanCardComments,
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
const MAX_COMMENT_LENGTH = 2_000;
const MAX_ATTACHMENTS_PER_CARD = 40;
const MAX_FILES_PER_UPLOAD = 5;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENT_REQUEST_BYTES = MAX_FILES_PER_UPLOAD * MAX_ATTACHMENT_BYTES + 512 * 1024;
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
    const attachmentKeys = await listKanbanAttachmentKeysForBoard(env.DB, boardId);
    const deleted = await deleteKanbanBoard(env.DB, boardId, authenticated.account.id);
    if (!deleted) return authError(404, "Quadro não encontrado.");
    await removeStoredAttachments(env.DOCUMENTS, attachmentKeys);
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
  const parsed = parseCardBody(body, new Set(board.members.map((item) => item.id)), true);
  if (parsed instanceof Response) return parsed;
  if (!parsed.startDate || parsed.durationDays === null) {
    return authError(400, "Informe a data de início e os dias de vigência da tarefa.");
  }

  const card = await createKanbanCard(env.DB, {
    id: crypto.randomUUID(),
    boardId,
    ...parsed,
    startDate: parsed.startDate,
    durationDays: parsed.durationDays,
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
    const attachmentKeys = await listKanbanAttachmentKeysForCard(env.DB, cardId);
    const deleted = await deleteKanbanCard(env.DB, {
      cardId,
      boardId: access.boardId,
      actor: accountPerson(authenticated),
      now: unixNow(),
    });
    if (!deleted) return authError(404, "Cartão não encontrado.");
    await removeStoredAttachments(env.DOCUMENTS, attachmentKeys);
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

export async function handleKanbanCardDetails(
  request: Request,
  env: Env,
  cardId: string,
): Promise<Response> {
  if (request.method !== "GET") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  const access = await getKanbanCardAccess(env.DB, cardId, authenticated.account.id);
  if (!access) return authError(404, "Cartão não encontrado ou sem acesso.");
  return authJson(200, await getCardDetails(env.DB, cardId));
}

export async function handleKanbanCardComments(
  request: Request,
  env: Env,
  cardId: string,
): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  const access = await getKanbanCardAccess(env.DB, cardId, authenticated.account.id);
  if (!access) return authError(404, "Cartão não encontrado ou sem acesso.");
  if (!access.canEdit) return authError(403, "Você não tem permissão para comentar neste cartão.");
  const body = await readBodyOrResponse(request);
  if (body instanceof Response) return body;
  const commentBody = cleanMultiline(body.body, MAX_COMMENT_LENGTH);
  if (!commentBody) return authError(400, "Escreva um comentário antes de enviar.");

  const comment = await createKanbanCardComment(env.DB, {
    id: crypto.randomUUID(),
    cardId,
    boardId: access.boardId,
    body: commentBody,
    actor: accountPerson(authenticated),
    now: unixNow(),
  });
  return authJson(201, {
    timelineItem: {
      id: comment.id,
      type: "comment",
      body: comment.body,
      actor: comment.author,
      createdAt: comment.createdAt,
    },
  });
}

export async function handleKanbanCardAttachments(
  request: Request,
  env: Env,
  cardId: string,
): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  const access = await getKanbanCardAccess(env.DB, cardId, authenticated.account.id);
  if (!access) return authError(404, "Cartão não encontrado ou sem acesso.");
  if (!access.canEdit) return authError(403, "Você não tem permissão para anexar arquivos neste cartão.");

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_ATTACHMENT_REQUEST_BYTES) {
    return authError(413, "O envio ultrapassa o limite permitido.");
  }
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("multipart/form-data")) {
    return authError(400, "Envie os arquivos no formato correto.");
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return authError(400, "Não foi possível ler os arquivos enviados.");
  }
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);
  if (!files.length) return authError(400, "Selecione pelo menos um arquivo.");
  if (files.length > MAX_FILES_PER_UPLOAD) {
    return authError(400, `Envie no máximo ${MAX_FILES_PER_UPLOAD} arquivos por vez.`);
  }
  const existingCount = await countKanbanCardAttachments(env.DB, cardId);
  if (existingCount + files.length > MAX_ATTACHMENTS_PER_CARD) {
    return authError(400, `Cada cartão pode guardar até ${MAX_ATTACHMENTS_PER_CARD} arquivos.`);
  }

  const uploads = files.map((file) => ({
    id: crypto.randomUUID(),
    objectKey: `kanban/${access.boardId}/${cardId}/${crypto.randomUUID()}`,
    filename: cleanSingleLine(file.name, 180) || "arquivo",
    contentType: cleanSingleLine(file.type, 120) || "application/octet-stream",
    sizeBytes: file.size,
    file,
  }));
  if (uploads.some((upload) => upload.sizeBytes <= 0 || upload.sizeBytes > MAX_ATTACHMENT_BYTES)) {
    return authError(400, "Cada arquivo deve ter conteúdo e no máximo 10 MB.");
  }
  const totalBytes = uploads.reduce((total, upload) => total + upload.sizeBytes, 0);
  if (totalBytes > MAX_FILES_PER_UPLOAD * MAX_ATTACHMENT_BYTES) {
    return authError(413, "O envio ultrapassa o limite permitido.");
  }

  const storedKeys: string[] = [];
  try {
    for (const upload of uploads) {
      await env.DOCUMENTS.put(upload.objectKey, upload.file.stream(), {
        httpMetadata: { contentType: upload.contentType },
        customMetadata: { filename: upload.filename },
      });
      storedKeys.push(upload.objectKey);
    }
  } catch (error) {
    await removeStoredAttachments(env.DOCUMENTS, storedKeys);
    console.error("Falha ao armazenar anexos do Kanban", error);
    return authError(500, "Não foi possível salvar os arquivos.");
  }

  try {
    await createKanbanCardAttachments(env.DB, {
      cardId,
      boardId: access.boardId,
      attachments: uploads.map((upload) => ({
        id: upload.id,
        objectKey: upload.objectKey,
        filename: upload.filename,
        contentType: upload.contentType,
        sizeBytes: upload.sizeBytes,
      })),
      actor: accountPerson(authenticated),
      now: unixNow(),
    });
  } catch (error) {
    await removeStoredAttachments(env.DOCUMENTS, storedKeys);
    console.error("Falha ao registrar anexos do Kanban", error);
    return authError(500, "Não foi possível salvar os arquivos.");
  }

  return authJson(201, await getCardDetails(env.DB, cardId));
}

export async function handleKanbanAttachmentMutation(
  request: Request,
  env: Env,
  cardId: string,
  attachmentId: string,
  download: boolean,
): Promise<Response> {
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  const access = await getKanbanCardAccess(env.DB, cardId, authenticated.account.id);
  if (!access) return authError(404, "Cartão não encontrado ou sem acesso.");
  const attachment = await getKanbanCardAttachment(env.DB, cardId, attachmentId);
  if (!attachment) return authError(404, "Arquivo não encontrado.");

  if (download) {
    if (request.method !== "GET") return authError(405, "Método não permitido.");
    const object = await env.DOCUMENTS.get(attachment.objectKey);
    if (!object) return authError(404, "O conteúdo deste arquivo não foi encontrado.");
    const wantsPreview = new URL(request.url).searchParams.get("view") === "1";
    const previewInline = wantsPreview && isPreviewableAttachmentType(attachment.contentType);
    return new Response(object.body, {
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Disposition": attachmentContentDisposition(
          attachment.filename,
          previewInline ? "inline" : "attachment",
        ),
        "Content-Length": String(attachment.sizeBytes),
        "Content-Type": attachment.contentType || "application/octet-stream",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  if (request.method !== "DELETE") return authError(405, "Método não permitido.");
  if (!access.canEdit) return authError(403, "Você não tem permissão para remover arquivos deste cartão.");
  const deleted = await deleteKanbanCardAttachment(env.DB, {
    cardId,
    boardId: access.boardId,
    attachmentId,
    actor: accountPerson(authenticated),
    now: unixNow(),
  });
  if (!deleted) return authError(404, "Arquivo não encontrado.");
  await removeStoredAttachments(env.DOCUMENTS, [deleted.objectKey]);
  return authJson(200, await getCardDetails(env.DB, cardId));
}

async function getCardDetails(db: D1Database, cardId: string) {
  const [attachments, activities, comments] = await Promise.all([
    listKanbanCardAttachments(db, cardId),
    listKanbanCardActivity(db, cardId),
    listKanbanCardComments(db, cardId),
  ]);
  const timeline = [
    ...activities.map((activity) => ({
      id: activity.id,
      type: "activity" as const,
      action: activity.action,
      summary: activity.summary,
      details: activity.details,
      actor: activity.actor,
      createdAt: activity.createdAt,
    })),
    ...comments.map((comment) => ({
      id: comment.id,
      type: "comment" as const,
      body: comment.body,
      actor: comment.author,
      createdAt: comment.createdAt,
    })),
  ]
    .sort((left, right) => right.createdAt - left.createdAt || right.id.localeCompare(left.id))
    .slice(0, 160);
  return { attachments, timeline };
}

async function removeStoredAttachments(bucket: R2Bucket, objectKeys: string[]): Promise<void> {
  if (!objectKeys.length) return;
  try {
    for (let index = 0; index < objectKeys.length; index += 1_000) {
      await bucket.delete(objectKeys.slice(index, index + 1_000));
    }
  } catch (error) {
    console.error("Falha ao remover objetos de anexos do Kanban", error);
  }
}

function attachmentContentDisposition(
  filename: string,
  disposition: "attachment" | "inline" = "attachment",
): string {
  const asciiName = filename
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/["\\]/g, "_")
    .slice(0, 120) || "arquivo";
  return `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function isPreviewableAttachmentType(contentType: string): boolean {
  const normalized = contentType.toLowerCase().split(";", 1)[0].trim();
  return normalized === "application/pdf"
    || normalized === "application/json"
    || normalized === "text/plain"
    || normalized === "text/csv"
    || normalized === "image/jpeg"
    || normalized === "image/png"
    || normalized === "image/gif"
    || normalized === "image/webp"
    || normalized === "image/avif"
    || normalized === "audio/mpeg"
    || normalized === "audio/ogg"
    || normalized === "audio/wav"
    || normalized === "video/mp4"
    || normalized === "video/webm";
}

export async function handleKanbanNotifications(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "GET") return authError(405, "Método não permitido.");
  const authenticated = await requireKanbanAccount(request, env);
  if (authenticated instanceof Response) return authenticated;
  const includeAll = new URL(request.url).searchParams.get("all") === "1";
  return authJson(200, await listKanbanNotifications(env.DB, authenticated.account.id, includeAll));
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
  requireSchedule = false,
): {
  title: string;
  description: string;
  startDate: string | null;
  durationDays: number | null;
  status: KanbanStatus;
  assigneeIds: string[];
} | Response {
  const title = cleanSingleLine(body.title, 160);
  const description = cleanMultiline(body.description, 2_000);
  const startDate = cleanSingleLine(body.startDate, 10) || null;
  const hasDuration = body.durationDays !== null && body.durationDays !== undefined && body.durationDays !== "";
  const durationDays = hasDuration ? Number(body.durationDays) : null;
  const status = body.status;
  if (!title) return authError(400, "Informe o título do cartão.");
  if (requireSchedule && (!startDate || durationDays === null)) {
    return authError(400, "Informe a data de início e os dias de vigência da tarefa.");
  }
  if ((startDate && durationDays === null) || (!startDate && durationDays !== null)) {
    return authError(400, "Informe a data de início e a vigência juntas.");
  }
  if (startDate && !isValidIsoDate(startDate)) return authError(400, "Informe uma data de início válida.");
  if (durationDays !== null && (!Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650)) {
    return authError(400, "Informe uma vigência entre 1 e 3650 dias.");
  }
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

  return { title, description, startDate, durationDays, status: status as KanbanStatus, assigneeIds };
}

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10) === value;
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
