import { timingSafeEqual } from "node:crypto";
import {
  clearLoginAttempts,
  createSession,
  createUserAndSession,
  deleteExpiredSessions,
  deleteOpenAICredential,
  deleteSession,
  findUserByEmail,
  getAccountBySession,
  getLoginAttempt,
  getOpenAICredential,
  recordLoginFailure,
  saveOpenAICredential,
  updateOpenAIModel,
  type AccountSummary,
} from "../db/auth";

const SESSION_SECONDS = 60 * 60 * 24 * 7;
const PASSWORD_ITERATIONS = 600_000;
const MAX_AUTH_BODY_BYTES = 16 * 1024;
const LOGIN_WINDOW_SECONDS = 15 * 60;
const MAX_LOGIN_FAILURES = 5;
const DUMMY_PASSWORD_SALT = "AAAAAAAAAAAAAAAAAAAAAA";
const DUMMY_PASSWORD_HASH = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

type AuthenticatedRequest = {
  account: AccountSummary;
  tokenHash: string;
};

type JsonObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function authJson(
  status: number,
  body: JsonObject,
  headers?: HeadersInit,
): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "no-store");
  return Response.json(body, { status, headers: responseHeaders });
}

export function authError(status: number, message: string): Response {
  return authJson(status, { error: { message } });
}

export async function handleRegister(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");

  let body: JsonObject;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return authError(400, errorMessage(error, "Dados de cadastro inválidos."));
  }

  const name = cleanText(body.name, 80);
  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) return authError(400, "Informe seu nome.");
  if (!isValidEmail(email)) return authError(400, "Informe um e-mail válido.");
  const passwordError = validatePassword(password);
  if (passwordError) return authError(400, passwordError);

  if (await findUserByEmail(env.DB, email)) {
    return authError(409, "Este e-mail já possui uma conta. Entre com sua senha.");
  }

  const salt = randomBytes(16);
  const passwordHash = await derivePassword(password, salt, PASSWORD_ITERATIONS);
  const sessionToken = randomToken();
  const tokenHash = await hashText(sessionToken);
  const now = unixNow();
  const expiresAt = now + SESSION_SECONDS;
  const userId = crypto.randomUUID();

  try {
    await createUserAndSession(env.DB, {
      userId,
      name,
      email,
      passwordHash: bytesToBase64Url(passwordHash),
      passwordSalt: bytesToBase64Url(salt),
      passwordIterations: PASSWORD_ITERATIONS,
      tokenHash,
      now,
      expiresAt,
    });
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      return authError(409, "Este e-mail já possui uma conta. Entre com sua senha.");
    }
    throw error;
  }

  ctx.waitUntil(deleteExpiredSessions(env.DB, now));
  return authJson(
    201,
    {
      user: { id: userId, name, email },
      api: { hasKey: false, model: null, lastFour: null },
    },
    { "Set-Cookie": sessionCookie(request, sessionToken, SESSION_SECONDS) },
  );
}

export async function handleLogin(
  request: Request,
  env: Env,
  ctx: ExecutionContext,
): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");

  let body: JsonObject;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return authError(400, errorMessage(error, "Dados de acesso inválidos."));
  }

  const email = normalizeEmail(body.email);
  const password = typeof body.password === "string" ? body.password : "";
  if (!isValidEmail(email) || !password) {
    return authError(401, "E-mail ou senha incorretos.");
  }

  const now = unixNow();
  const attemptKey = await loginAttemptKey(request, email);
  const attempt = await getLoginAttempt(env.DB, attemptKey);
  if (attempt && attempt.blocked_until > now) {
    return authError(429, "Muitas tentativas. Aguarde alguns minutos e tente novamente.");
  }

  const user = await findUserByEmail(env.DB, email);
  const passwordSalt = user?.passwordSalt ?? DUMMY_PASSWORD_SALT;
  const passwordHash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordIterations = user?.passwordIterations ?? PASSWORD_ITERATIONS;
  const validPassword = await verifyPassword(
    password,
    passwordSalt,
    passwordHash,
    passwordIterations,
  );

  if (!user || !validPassword) {
    await storeLoginFailure(env.DB, attemptKey, attempt, now);
    return authError(401, "E-mail ou senha incorretos.");
  }

  const sessionToken = randomToken();
  const tokenHash = await hashText(sessionToken);
  const expiresAt = now + SESSION_SECONDS;
  await createSession(env.DB, { tokenHash, userId: user.id, now, expiresAt });
  await clearLoginAttempts(env.DB, attemptKey);
  ctx.waitUntil(deleteExpiredSessions(env.DB, now));

  const account = await getAccountBySession(env.DB, tokenHash, now);
  if (!account) throw new Error("A sessão criada não pôde ser recuperada.");

  return authJson(
    200,
    accountPayload(account),
    { "Set-Cookie": sessionCookie(request, sessionToken, SESSION_SECONDS) },
  );
}

export async function handleLogout(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");
  const token = sessionTokenFromRequest(request);
  if (token) await deleteSession(env.DB, await hashText(token));
  return authJson(
    200,
    { ok: true },
    { "Set-Cookie": sessionCookie(request, "", 0) },
  );
}

export async function handleSession(request: Request, env: Env): Promise<Response> {
  if (request.method !== "GET") return authError(405, "Método não permitido.");
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Entre para continuar.");
  return authJson(200, accountPayload(authenticated.account));
}

export async function handleApiKey(
  request: Request,
  env: Env,
): Promise<Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");

  if (request.method === "GET") {
    return authJson(200, accountPayload(authenticated.account).api as JsonObject);
  }

  if (request.method === "DELETE") {
    await deleteOpenAICredential(env.DB, authenticated.account.id);
    return authJson(200, { hasKey: false, model: null, lastFour: null });
  }

  if (request.method !== "PUT") return authError(405, "Método não permitido.");

  let body: JsonObject;
  try {
    body = await readJsonObject(request);
  } catch (error) {
    return authError(400, errorMessage(error, "Configuração inválida."));
  }

  const apiKey = typeof body.apiKey === "string" ? body.apiKey.trim() : "";
  const model = cleanText(body.model, 120);
  if (!isValidModel(model)) return authError(400, "Escolha um modelo válido.");

  const now = unixNow();
  if (!apiKey) {
    const updated = await updateOpenAIModel(env.DB, authenticated.account.id, model, now);
    if (!updated) return authError(400, "Informe sua chave da API da OpenAI.");
    return authJson(200, {
      hasKey: true,
      model,
      lastFour: authenticated.account.apiKeyLastFour,
    });
  }

  if (!isValidOpenAIKey(apiKey)) {
    return authError(400, "Informe uma chave válida da API da OpenAI.");
  }

  const encrypted = await encryptApiKey(apiKey, authenticated.account.id, env);
  const lastFour = apiKey.slice(-4);
  await saveOpenAICredential(env.DB, {
    userId: authenticated.account.id,
    encryptedKey: encrypted.ciphertext,
    iv: encrypted.iv,
    model,
    lastFour,
    now,
  });

  return authJson(200, { hasKey: true, model, lastFour });
}

export async function authenticateRequest(
  request: Request,
  env: Env,
): Promise<AuthenticatedRequest | null> {
  const token = sessionTokenFromRequest(request);
  if (!token) return null;
  const tokenHash = await hashText(token);
  const account = await getAccountBySession(env.DB, tokenHash, unixNow());
  return account ? { account, tokenHash } : null;
}

export async function openAICredentialForUser(
  env: Env,
  userId: string,
): Promise<{ apiKey: string; model: string } | null> {
  const credential = await getOpenAICredential(env.DB, userId);
  if (!credential) return null;
  const apiKey = await decryptApiKey(
    credential.encryptedKey,
    credential.iv,
    userId,
    env,
  );
  return { apiKey, model: credential.model };
}

function accountPayload(account: AccountSummary): JsonObject {
  return {
    user: { id: account.id, name: account.name, email: account.email },
    api: {
      hasKey: account.hasApiKey,
      model: account.apiModel,
      lastFour: account.apiKeyLastFour,
    },
  };
}

async function readJsonObject(request: Request): Promise<JsonObject> {
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_AUTH_BODY_BYTES) throw new Error("Solicitação muito grande.");
  if (!request.headers.get("Content-Type")?.toLowerCase().includes("application/json")) {
    throw new Error("Envie os dados no formato correto.");
  }
  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_AUTH_BODY_BYTES) throw new Error("Solicitação muito grande.");
  const value: unknown = JSON.parse(new TextDecoder().decode(bytes));
  if (!isJsonObject(value)) {
    throw new Error("Dados inválidos.");
  }
  return value;
}

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function normalizeEmail(value: unknown): string {
  return cleanText(value, 254).toLocaleLowerCase("pt-BR");
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validatePassword(password: string): string | null {
  if (password.length < 8) return "A senha deve ter pelo menos 8 caracteres.";
  if (password.length > 128) return "A senha deve ter no máximo 128 caracteres.";
  return null;
}

function isValidOpenAIKey(value: string): boolean {
  return value.startsWith("sk-") && value.length >= 20 && value.length <= 500 && !/\s/.test(value);
}

function isValidModel(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{1,119}$/.test(value);
}

async function derivePassword(
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  iterations: number,
): Promise<Uint8Array<ArrayBuffer>> {
  const passwordKey = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    passwordKey,
    256,
  );
  return new Uint8Array(bits);
}

async function verifyPassword(
  password: string,
  salt: string,
  expectedHash: string,
  iterations: number,
): Promise<boolean> {
  const actual = await derivePassword(password, base64UrlToBytes(salt), iterations);
  const expected = base64UrlToBytes(expectedHash);
  if (expected.byteLength !== actual.byteLength) return false;
  return timingSafeEqual(actual, expected);
}

async function encryptApiKey(
  apiKey: string,
  userId: string,
  env: Env,
): Promise<{ ciphertext: string; iv: string }> {
  const key = await encryptionKey(env);
  const iv = randomBytes(12);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: new TextEncoder().encode(userId) },
    key,
    new TextEncoder().encode(apiKey),
  );
  return {
    ciphertext: bytesToBase64Url(new Uint8Array(ciphertext)),
    iv: bytesToBase64Url(iv),
  };
}

async function decryptApiKey(
  ciphertext: string,
  iv: string,
  userId: string,
  env: Env,
): Promise<string> {
  const key = await encryptionKey(env);
  const plaintext = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: base64UrlToBytes(iv),
      additionalData: new TextEncoder().encode(userId),
    },
    key,
    base64UrlToBytes(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}

async function encryptionKey(env: Env): Promise<CryptoKey> {
  const raw = base64UrlToBytes(env.API_ENCRYPTION_KEY);
  if (raw.byteLength !== 32) {
    throw new Error("API_ENCRYPTION_KEY deve conter exatamente 32 bytes.");
  }
  return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
}

async function hashText(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

function randomToken(): string {
  return bytesToBase64Url(randomBytes(32));
}

function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(new ArrayBuffer(length));
  crypto.getRandomValues(bytes);
  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array<ArrayBuffer>): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function sessionTokenFromRequest(request: Request): string | null {
  const cookies = request.headers.get("Cookie") || "";
  const values = new Map(
    cookies
      .split(";")
      .map((part) => part.trim().split("="))
      .filter((part) => part.length >= 2)
      .map(([name, ...value]) => [name, value.join("=")]),
  );
  return values.get("__Host-docflow_session") || values.get("docflow_session") || null;
}

function sessionCookie(request: Request, value: string, maxAge: number): string {
  const secure = new URL(request.url).protocol === "https:";
  const name = secure ? "__Host-docflow_session" : "docflow_session";
  const expires = maxAge > 0 ? "" : "; Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${expires}${secure ? "; Secure" : ""}`;
}

async function loginAttemptKey(request: Request, email: string): Promise<string> {
  const ip = request.headers.get("CF-Connecting-IP") || "local";
  return hashText(`${email}\n${ip}`);
}

async function storeLoginFailure(
  db: D1Database,
  attemptKey: string,
  previous: Awaited<ReturnType<typeof getLoginAttempt>>,
  now: number,
): Promise<void> {
  const expiredWindow = !previous || previous.window_started_at + LOGIN_WINDOW_SECONDS <= now;
  const failureCount = expiredWindow ? 1 : previous.failure_count + 1;
  const windowStartedAt = expiredWindow ? now : previous.window_started_at;
  const blockedUntil = failureCount >= MAX_LOGIN_FAILURES ? now + LOGIN_WINDOW_SECONDS : 0;
  await recordLoginFailure(db, {
    attemptKey,
    failureCount,
    windowStartedAt,
    blockedUntil,
  });
}

function unixNow(): number {
  return Math.floor(Date.now() / 1000);
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
