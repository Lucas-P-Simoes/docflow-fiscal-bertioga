import {
  listManagedUsers,
  updateManagedUserStatus,
} from "../db/admin";
import { authenticateRequest, authError, authJson } from "./auth";
import { ADMIN_EMAIL } from "./constants";

const MAX_ADMIN_BODY_BYTES = 4 * 1024;

type JsonObject = Record<string, unknown>;
type AuthenticatedAdmin = NonNullable<
  Awaited<ReturnType<typeof authenticateRequest>>
>;

export async function handleAdminUsers(
  request: Request,
  env: Env,
): Promise<Response> {
  if (request.method !== "GET") return authError(405, "Método não permitido.");
  const authenticated = await authenticateAdmin(request, env);
  if (authenticated instanceof Response) return authenticated;

  return authJson(200, { users: await listManagedUsers(env.DB) });
}

export async function handleAdminUserMutation(
  request: Request,
  env: Env,
  userId: string,
): Promise<Response> {
  if (request.method !== "PATCH") return authError(405, "Método não permitido.");
  const authenticated = await authenticateAdmin(request, env);
  if (authenticated instanceof Response) return authenticated;

  let body: JsonObject;
  try {
    body = await readAdminBody(request);
  } catch (error) {
    return authError(400, error instanceof Error ? error.message : "Dados inválidos.");
  }

  const status = body.status;
  if (status !== "approved" && status !== "rejected") {
    return authError(400, "Escolha entre aprovar ou recusar o acesso.");
  }

  const user = await updateManagedUserStatus(env.DB, {
    userId,
    status,
    reviewedBy: authenticated.account.id,
    now: Math.floor(Date.now() / 1000),
  });
  if (!user) return authError(404, "Usuário não encontrado ou não pode ser alterado.");

  return authJson(200, { user });
}

async function authenticateAdmin(
  request: Request,
  env: Env,
): Promise<AuthenticatedAdmin | Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");
  if (!authenticated.account.isAdmin || authenticated.account.email !== ADMIN_EMAIL) {
    return authError(403, "Esta área é exclusiva do administrador.");
  }
  return authenticated;
}

async function readAdminBody(request: Request): Promise<JsonObject> {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_ADMIN_BODY_BYTES) throw new Error("Solicitação muito grande.");
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    throw new Error("Envie os dados no formato correto.");
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_ADMIN_BODY_BYTES) throw new Error("Solicitação muito grande.");
  const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!isJsonObject(parsed)) {
    throw new Error("Dados inválidos.");
  }
  return parsed;
}

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
