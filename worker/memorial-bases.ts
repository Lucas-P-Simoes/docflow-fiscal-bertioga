import {
  authenticateRequest,
  authError,
  authJson,
  openAICredentialForAccount,
} from "./auth";
import { ADMIN_EMAIL } from "./constants";

const MEMORIAL_BASE_PREFIX = "reference-data/memorial/admin-bases/";
const MEMORIAL_BASE_INDEX_PREFIX = "reference-data/memorial/admin-bases-index/";
const MEMORIAL_BASE_META_PREFIX = "reference-data/memorial/admin-bases-meta/";
const MEMORIAL_KNOWLEDGE_CONFIG_KEY = "reference-data/memorial/knowledge-config.json";
const OPENAI_FILES_URL = "https://api.openai.com/v1/files";
const OPENAI_VECTOR_STORES_URL = "https://api.openai.com/v1/vector_stores";
const MAX_BASE_FILE_BYTES = 10 * 1024 * 1024;
const MAX_BASE_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_BASE_FILES = 10;
const MAX_INDEX_FILE_BYTES = 24 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "xlsx", "csv", "tsv", "txt"]);
const SPREADSHEET_EXTENSIONS = new Set(["xlsx", "csv", "tsv"]);

type MemorialBaseStatus = "pending" | "processing" | "ready" | "error";

type MemorialBaseRecord = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  indexStatus: MemorialBaseStatus;
  indexedAt: string;
  indexError: string;
};

type MemorialBaseMetadata = {
  id: string;
  indexStatus: MemorialBaseStatus;
  indexedAt?: string;
  indexError?: string;
  openAIFileId?: string;
  vectorStoreId?: string;
  indexFilename?: string;
  credentialFingerprint?: string;
  updatedAt: string;
};

type MemorialKnowledgeConfig = {
  vectorStoreId: string;
  credentialFingerprint: string;
  createdAt: string;
};

type OpenAIJson = Record<string, unknown>;

function isAdministrator(account: { isAdmin: boolean; email: string }): boolean {
  return account.isAdmin && account.email === ADMIN_EMAIL;
}

function extensionOf(filename: string): string {
  return filename.toLowerCase().split(".").pop() || "";
}

function safeFilename(value: string): string {
  return Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return character === "\\" || character === "/" || code <= 31 || code === 127 ? "-" : character;
  }).join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180) || "arquivo-base";
}

function baseIdFromKey(key: string): string {
  return key.slice(MEMORIAL_BASE_PREFIX.length);
}

function contentDisposition(filename: string): string {
  const ascii = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._ -]/g, "-")
    .replace(/["\\]/g, "-") || "arquivo-base";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function metadataKey(baseId: string): string {
  return `${MEMORIAL_BASE_META_PREFIX}${baseId}.json`;
}

function indexObjectKey(baseId: string): string {
  return `${MEMORIAL_BASE_INDEX_PREFIX}${baseId}`;
}

async function readJson<T>(env: Env, key: string): Promise<T | null> {
  const object = await env.DOCUMENTS.get(key);
  if (!object) return null;
  try {
    return JSON.parse(await object.text()) as T;
  } catch {
    return null;
  }
}

async function writeJson(env: Env, key: string, value: unknown): Promise<void> {
  await env.DOCUMENTS.put(key, JSON.stringify(value), {
    httpMetadata: { contentType: "application/json; charset=utf-8" },
  });
}

async function readBaseMetadata(env: Env, baseId: string): Promise<MemorialBaseMetadata | null> {
  return readJson<MemorialBaseMetadata>(env, metadataKey(baseId));
}

async function writeBaseMetadata(env: Env, metadata: MemorialBaseMetadata): Promise<void> {
  await writeJson(env, metadataKey(metadata.id), metadata);
}

async function recordFromObject(env: Env, object: R2Object): Promise<MemorialBaseRecord> {
  const id = baseIdFromKey(object.key);
  const metadata = await readBaseMetadata(env, id);
  return {
    id,
    filename: object.customMetadata?.originalFilename || "arquivo-base",
    contentType: object.httpMetadata?.contentType || object.customMetadata?.contentType || "application/octet-stream",
    sizeBytes: object.size,
    uploadedAt: object.customMetadata?.uploadedAt || object.uploaded.toISOString(),
    indexStatus: metadata?.indexStatus || "pending",
    indexedAt: metadata?.indexedAt || "",
    indexError: metadata?.indexError || "",
  };
}

async function listBaseObjects(env: Env): Promise<R2Object[]> {
  const objects: R2Object[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.DOCUMENTS.list({
      prefix: MEMORIAL_BASE_PREFIX,
      cursor,
      limit: 100,
      include: ["httpMetadata", "customMetadata"],
    });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects;
}

async function credentialFingerprint(apiKey: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(apiKey));
  return Array.from(new Uint8Array(digest).slice(0, 12), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function openAIJson(
  apiKey: string,
  url: string,
  init: RequestInit = {},
): Promise<OpenAIJson> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiKey}`);
  const response = await fetch(url, { ...init, headers });
  let payload: OpenAIJson = {};
  try {
    payload = await response.json() as OpenAIJson;
  } catch {
    // Mantém a mensagem por status se o provedor não retornar JSON.
  }
  if (!response.ok) {
    const error = payload.error && typeof payload.error === "object"
      ? payload.error as OpenAIJson
      : null;
    const detail = typeof error?.message === "string" ? error.message : "";
    throw new Error(detail || `A indexação foi recusada pela OpenAI (HTTP ${response.status}).`);
  }
  return payload;
}

async function getOrCreateVectorStore(env: Env, apiKey: string): Promise<string> {
  const fingerprint = await credentialFingerprint(apiKey);
  const existing = await readJson<MemorialKnowledgeConfig>(env, MEMORIAL_KNOWLEDGE_CONFIG_KEY);
  if (existing?.vectorStoreId && existing.credentialFingerprint === fingerprint) {
    return existing.vectorStoreId;
  }

  const created = await openAIJson(apiKey, OPENAI_VECTOR_STORES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "DocFlow — Base permanente do Memorial Descritivo" }),
  });
  if (typeof created.id !== "string" || !created.id) {
    throw new Error("A OpenAI não retornou o identificador da base vetorial.");
  }
  await writeJson(env, MEMORIAL_KNOWLEDGE_CONFIG_KEY, {
    vectorStoreId: created.id,
    credentialFingerprint: fingerprint,
    createdAt: new Date().toISOString(),
  } satisfies MemorialKnowledgeConfig);
  return created.id;
}

async function uploadOpenAIFile(apiKey: string, file: File): Promise<string> {
  const form = new FormData();
  form.append("purpose", "assistants");
  form.append("file", file, file.name);
  const uploaded = await openAIJson(apiKey, OPENAI_FILES_URL, {
    method: "POST",
    body: form,
  });
  if (typeof uploaded.id !== "string" || !uploaded.id) {
    throw new Error("A OpenAI não retornou o identificador do arquivo indexado.");
  }
  return uploaded.id;
}

async function deleteOpenAIFile(apiKey: string, openAIFileId: string): Promise<void> {
  try {
    await openAIJson(apiKey, `${OPENAI_FILES_URL}/${encodeURIComponent(openAIFileId)}`, {
      method: "DELETE",
    });
  } catch {
    // A remoção local continua mesmo se o arquivo remoto já não existir.
  }
}

async function attachVectorStoreFile(
  apiKey: string,
  vectorStoreId: string,
  openAIFileId: string,
  baseId: string,
  filename: string,
): Promise<OpenAIJson> {
  return openAIJson(
    apiKey,
    `${OPENAI_VECTOR_STORES_URL}/${encodeURIComponent(vectorStoreId)}/files`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        file_id: openAIFileId,
        attributes: {
          docflow_base_id: baseId,
          original_filename: filename.slice(0, 500),
        },
      }),
    },
  );
}

async function vectorStoreFileStatus(
  apiKey: string,
  vectorStoreId: string,
  openAIFileId: string,
): Promise<OpenAIJson> {
  return openAIJson(
    apiKey,
    `${OPENAI_VECTOR_STORES_URL}/${encodeURIComponent(vectorStoreId)}/files/${encodeURIComponent(openAIFileId)}`,
  );
}

async function waitForVectorStoreFile(
  apiKey: string,
  vectorStoreId: string,
  openAIFileId: string,
  initial: OpenAIJson,
): Promise<"completed" | "processing"> {
  let current = initial;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const status = typeof current.status === "string" ? current.status : "";
    if (status === "completed") return "completed";
    if (status === "failed" || status === "cancelled") {
      const lastError = current.last_error && typeof current.last_error === "object"
        ? current.last_error as OpenAIJson
        : null;
      throw new Error(typeof lastError?.message === "string" ? lastError.message : "A OpenAI não conseguiu processar o arquivo-base.");
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    current = await vectorStoreFileStatus(apiKey, vectorStoreId, openAIFileId);
  }
  return "processing";
}

function cleanIndexError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Não foi possível indexar o arquivo-base.";
  return message.replace(/\s+/g, " ").trim().slice(0, 320) || "Não foi possível indexar o arquivo-base.";
}

async function sourceFileForIndex(env: Env, object: R2ObjectBody): Promise<File> {
  const baseId = baseIdFromKey(object.key);
  const filename = object.customMetadata?.originalFilename || "arquivo-base";
  if (SPREADSHEET_EXTENSIONS.has(extensionOf(filename))) {
    const normalized = await env.DOCUMENTS.get(indexObjectKey(baseId));
    if (!normalized) {
      throw new Error("Reenvie esta planilha para que todas as abas sejam convertidas e indexadas.");
    }
    const indexFilename = normalized.customMetadata?.indexFilename || `${filename}.txt`;
    return new File([await normalized.arrayBuffer()], indexFilename, { type: "text/plain" });
  }
  const contentType = object.httpMetadata?.contentType || object.customMetadata?.contentType || "application/octet-stream";
  return new File([await object.arrayBuffer()], filename, { type: contentType });
}

async function indexMemorialBase(
  env: Env,
  apiKey: string,
  baseId: string,
): Promise<MemorialBaseMetadata> {
  const object = await env.DOCUMENTS.get(`${MEMORIAL_BASE_PREFIX}${baseId}`);
  if (!object) throw new Error("O arquivo-base não foi localizado.");
  const filename = object.customMetadata?.originalFilename || "arquivo-base";
  const previous = await readBaseMetadata(env, baseId);
  if (previous?.openAIFileId) await deleteOpenAIFile(apiKey, previous.openAIFileId);

  let metadata: MemorialBaseMetadata = {
    id: baseId,
    indexStatus: "processing",
    indexFilename: filename,
    credentialFingerprint: await credentialFingerprint(apiKey),
    updatedAt: new Date().toISOString(),
  };
  await writeBaseMetadata(env, metadata);

  let openAIFileId = "";
  try {
    const sourceFile = await sourceFileForIndex(env, object);
    const vectorStoreId = await getOrCreateVectorStore(env, apiKey);
    openAIFileId = await uploadOpenAIFile(apiKey, sourceFile);
    const attached = await attachVectorStoreFile(apiKey, vectorStoreId, openAIFileId, baseId, filename);
    metadata = {
      ...metadata,
      openAIFileId,
      vectorStoreId,
      indexFilename: sourceFile.name,
      updatedAt: new Date().toISOString(),
    };
    await writeBaseMetadata(env, metadata);
    const status = await waitForVectorStoreFile(apiKey, vectorStoreId, openAIFileId, attached);
    metadata = {
      ...metadata,
      indexStatus: status === "completed" ? "ready" : "processing",
      indexedAt: status === "completed" ? new Date().toISOString() : undefined,
      indexError: "",
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (openAIFileId) await deleteOpenAIFile(apiKey, openAIFileId);
    metadata = {
      ...metadata,
      indexStatus: "error",
      indexError: cleanIndexError(error),
      openAIFileId: undefined,
      vectorStoreId: undefined,
      updatedAt: new Date().toISOString(),
    };
  }
  await writeBaseMetadata(env, metadata);
  return metadata;
}

async function refreshProcessingMetadata(
  env: Env,
  apiKey: string,
  metadata: MemorialBaseMetadata,
): Promise<MemorialBaseMetadata> {
  if (metadata.indexStatus !== "processing" || !metadata.vectorStoreId || !metadata.openAIFileId) {
    return metadata;
  }
  try {
    const current = await vectorStoreFileStatus(apiKey, metadata.vectorStoreId, metadata.openAIFileId);
    const status = typeof current.status === "string" ? current.status : "";
    if (status === "completed") {
      const updated = {
        ...metadata,
        indexStatus: "ready" as const,
        indexedAt: new Date().toISOString(),
        indexError: "",
        updatedAt: new Date().toISOString(),
      };
      await writeBaseMetadata(env, updated);
      return updated;
    }
    if (status === "failed" || status === "cancelled") {
      const updated = {
        ...metadata,
        indexStatus: "error" as const,
        indexError: "A OpenAI não conseguiu processar o arquivo-base.",
        updatedAt: new Date().toISOString(),
      };
      await writeBaseMetadata(env, updated);
      return updated;
    }
  } catch {
    // Mantém o estado de processamento; o administrador pode tentar novamente.
  }
  return metadata;
}

async function recordForId(env: Env, baseId: string): Promise<MemorialBaseRecord | null> {
  const object = await env.DOCUMENTS.head(`${MEMORIAL_BASE_PREFIX}${baseId}`);
  return object ? recordFromObject(env, object) : null;
}

export async function handleMemorialBases(request: Request, env: Env): Promise<Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");
  if (!isAdministrator(authenticated.account)) {
    return authError(403, "Somente o administrador pode gerenciar as bases do Memorial Descritivo.");
  }

  const credential = await openAICredentialForAccount(env, authenticated.account);
  if (!credential) return authError(503, "Configure a chave da OpenAI antes de indexar os arquivos-base.");

  if (request.method === "GET") {
    const objects = await listBaseObjects(env);
    const currentFingerprint = await credentialFingerprint(credential.apiKey);
    let migratedExistingFile = false;
    for (const object of objects) {
      const metadata = await readBaseMetadata(env, baseIdFromKey(object.key));
      if (!metadata && !migratedExistingFile) {
        await indexMemorialBase(env, credential.apiKey, baseIdFromKey(object.key));
        migratedExistingFile = true;
      } else if (metadata?.credentialFingerprint && metadata.credentialFingerprint !== currentFingerprint) {
        await writeBaseMetadata(env, {
          id: metadata.id,
          indexStatus: "pending",
          indexError: "A chave da OpenAI foi alterada. Indexe este arquivo novamente.",
          indexFilename: metadata.indexFilename,
          credentialFingerprint: currentFingerprint,
          updatedAt: new Date().toISOString(),
        });
      } else if (metadata) {
        await refreshProcessingMetadata(env, credential.apiKey, metadata);
      }
    }
    const files = await Promise.all(objects.map((object) => recordFromObject(env, object)));
    files.sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
    return authJson(200, { files });
  }

  if (request.method !== "POST") return authError(405, "Método não permitido.");
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BASE_FILE_BYTES + MAX_INDEX_FILE_BYTES + 256 * 1024) {
    return authError(413, "Cada arquivo-base deve ter no máximo 10 MB.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return authError(400, "Não foi possível receber o arquivo-base.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) return authError(400, "Selecione um arquivo-base válido.");
  const filename = safeFilename(file.name);
  const extension = extensionOf(filename);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return authError(400, "Envie PDF, Word, XLSX, CSV, TSV ou TXT.");
  }
  if (file.size <= 0 || file.size > MAX_BASE_FILE_BYTES) {
    return authError(413, "Cada arquivo-base deve ter no máximo 10 MB.");
  }

  const indexFile = form.get("indexFile");
  if (SPREADSHEET_EXTENSIONS.has(extension)) {
    if (!(indexFile instanceof File) || indexFile.size <= 0 || indexFile.size > MAX_INDEX_FILE_BYTES) {
      return authError(400, "Não foi possível preparar todas as abas da planilha para indexação.");
    }
  }

  const current = await listBaseObjects(env);
  if (current.length >= MAX_BASE_FILES) {
    return authError(409, `O limite é de ${MAX_BASE_FILES} arquivos-base.`);
  }
  const totalBytes = current.reduce((total, object) => total + object.size, 0);
  if (totalBytes + file.size > MAX_BASE_TOTAL_BYTES) {
    return authError(413, "O conjunto de arquivos-base deve ter no máximo 20 MB.");
  }

  const id = crypto.randomUUID();
  const objectKey = `${MEMORIAL_BASE_PREFIX}${id}`;
  const uploadedAt = new Date().toISOString();
  const contentType = file.type || "application/octet-stream";
  await env.DOCUMENTS.put(objectKey, file.stream(), {
    httpMetadata: {
      contentType,
      contentDisposition: contentDisposition(filename),
    },
    customMetadata: {
      originalFilename: filename,
      contentType,
      uploadedAt,
      uploadedBy: authenticated.account.id,
    },
  });
  if (indexFile instanceof File && SPREADSHEET_EXTENSIONS.has(extension)) {
    const indexFilename = `${filename}.txt`;
    await env.DOCUMENTS.put(indexObjectKey(id), indexFile.stream(), {
      httpMetadata: { contentType: "text/plain; charset=utf-8" },
      customMetadata: { indexFilename },
    });
  }

  await indexMemorialBase(env, credential.apiKey, id);
  const record = await recordForId(env, id);
  return authJson(201, { file: record });
}

export async function handleMemorialBaseMutation(
  request: Request,
  env: Env,
  baseId: string,
  action: "delete" | "index" = "delete",
): Promise<Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");
  if (!isAdministrator(authenticated.account)) {
    return authError(403, "Somente o administrador pode gerenciar as bases do Memorial Descritivo.");
  }
  const credential = await openAICredentialForAccount(env, authenticated.account);
  if (!credential) return authError(503, "Configure a chave da OpenAI antes de gerenciar os arquivos-base.");

  if (action === "index") {
    if (request.method !== "POST") return authError(405, "Método não permitido.");
    await indexMemorialBase(env, credential.apiKey, baseId);
    const record = await recordForId(env, baseId);
    if (!record) return authError(404, "O arquivo-base não foi localizado.");
    return authJson(200, { file: record });
  }

  if (request.method !== "DELETE") return authError(405, "Método não permitido.");
  const metadata = await readBaseMetadata(env, baseId);
  if (metadata?.openAIFileId) await deleteOpenAIFile(credential.apiKey, metadata.openAIFileId);
  await env.DOCUMENTS.delete([
    `${MEMORIAL_BASE_PREFIX}${baseId}`,
    indexObjectKey(baseId),
    metadataKey(baseId),
  ]);
  return authJson(200, { deleted: true });
}

export async function searchMemorialBaseKnowledge(
  env: Env,
  apiKey: string,
  query: string,
): Promise<string[]> {
  const normalizedQuery = query.replace(/\s+/g, " ").trim().slice(0, 8_000);
  if (!normalizedQuery) return [];
  const config = await readJson<MemorialKnowledgeConfig>(env, MEMORIAL_KNOWLEDGE_CONFIG_KEY);
  if (!config?.vectorStoreId) return [];
  if (config.credentialFingerprint !== await credentialFingerprint(apiKey)) return [];

  try {
    const result = await openAIJson(
      apiKey,
      `${OPENAI_VECTOR_STORES_URL}/${encodeURIComponent(config.vectorStoreId)}/search`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: normalizedQuery,
          max_num_results: 8,
          rewrite_query: true,
        }),
      },
    );
    const rows = Array.isArray(result.data) ? result.data : [];
    const excerpts: string[] = [];
    let totalCharacters = 0;
    for (const row of rows) {
      if (!row || typeof row !== "object") continue;
      const item = row as OpenAIJson;
      const filename = typeof item.filename === "string" ? item.filename : "arquivo-base";
      const score = typeof item.score === "number" ? item.score.toFixed(3) : "";
      const contents = Array.isArray(item.content) ? item.content : [];
      const excerptText = contents
        .filter((content) => content && typeof content === "object" && (content as OpenAIJson).type === "text")
        .map((content) => String((content as OpenAIJson).text || ""))
        .join("\n")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 5_000);
      if (!excerptText) continue;
      const excerpt = `[Arquivo-base: ${filename}${score ? ` • relevância ${score}` : ""}]\n${excerptText}`;
      if (totalCharacters + excerpt.length > 24_000) break;
      excerpts.push(excerpt);
      totalCharacters += excerpt.length;
    }
    return excerpts;
  } catch {
    return [];
  }
}
