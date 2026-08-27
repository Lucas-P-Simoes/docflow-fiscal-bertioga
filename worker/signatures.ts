import {
  createSignatureProfile,
  deleteSignatureProfile,
  listSignatureProfiles,
  updateSignatureProfile,
  type SignatureProfile,
} from "../db/signatures";
import { authenticateRequest, authError, authJson } from "./auth";

const MAX_SIGNATURE_BODY_BYTES = 4 * 1024;

export async function handleSignatures(request: Request, env: Env): Promise<Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");

  if (request.method === "GET") {
    const signatures = await listSignatureProfiles(env.DB, authenticated.account.id);
    return authJson(200, { signatures });
  }

  if (request.method !== "POST") return authError(405, "Método não permitido.");

  const body = await readSignatureBody(request);
  if (body instanceof Response) return body;
  const now = Math.floor(Date.now() / 1000);
  const signature: SignatureProfile = {
    id: crypto.randomUUID(),
    name: body.name,
    role: body.role,
    createdAt: now,
    updatedAt: now,
  };
  await createSignatureProfile(env.DB, {
    ...signature,
    userId: authenticated.account.id,
  });
  return authJson(201, { signature });
}

export async function handleSignatureMutation(
  request: Request,
  env: Env,
  profileId: string,
): Promise<Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");

  if (request.method === "PATCH") {
    const body = await readSignatureBody(request);
    if (body instanceof Response) return body;
    const updatedAt = Math.floor(Date.now() / 1000);
    const updated = await updateSignatureProfile(env.DB, {
      id: profileId,
      userId: authenticated.account.id,
      name: body.name,
      role: body.role,
      updatedAt,
    });
    if (!updated) return authError(404, "Assinatura não encontrada.");
    return authJson(200, {
      signature: { id: profileId, name: body.name, role: body.role, updatedAt },
    });
  }

  if (request.method === "DELETE") {
    const deleted = await deleteSignatureProfile(
      env.DB,
      authenticated.account.id,
      profileId,
    );
    if (!deleted) return authError(404, "Assinatura não encontrada.");
    return authJson(200, { deleted: true });
  }

  return authError(405, "Método não permitido.");
}

async function readSignatureBody(
  request: Request,
): Promise<{ name: string; role: string } | Response> {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_SIGNATURE_BODY_BYTES) {
    return authError(413, "Os dados da assinatura são maiores que o limite permitido.");
  }

  let value: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_SIGNATURE_BODY_BYTES) {
      return authError(413, "Os dados da assinatura são maiores que o limite permitido.");
    }
    value = JSON.parse(text);
  } catch {
    return authError(400, "Informe nome e cargo válidos.");
  }

  if (!isObject(value)) return authError(400, "Informe nome e cargo válidos.");
  const name = cleanText(value.name, 100);
  const role = cleanText(value.role, 120);
  if (name.length < 2) return authError(400, "Informe o nome completo.");
  if (role.length < 2) return authError(400, "Informe o cargo ou função.");
  return { name, role };
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
