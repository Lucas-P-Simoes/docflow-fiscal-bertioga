import { authenticateRequest, authError, authJson } from "./auth";
import { ADMIN_EMAIL } from "./constants";

const MEMORIAL_BASE_PREFIX = "reference-data/memorial/admin-bases/";
const MAX_BASE_FILE_BYTES = 10 * 1024 * 1024;
const MAX_BASE_TOTAL_BYTES = 20 * 1024 * 1024;
const MAX_BASE_FILES = 10;
const ALLOWED_EXTENSIONS = new Set(["pdf", "docx", "xlsx", "xls", "csv", "tsv", "txt"]);

type MemorialBaseRecord = {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
};

type OpenAIInputFile = {
  type: "input_file";
  filename: string;
  file_data: string;
};

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

function recordFromObject(object: R2Object): MemorialBaseRecord {
  return {
    id: baseIdFromKey(object.key),
    filename: object.customMetadata?.originalFilename || "arquivo-base",
    contentType: object.httpMetadata?.contentType || object.customMetadata?.contentType || "application/octet-stream",
    sizeBytes: object.size,
    uploadedAt: object.customMetadata?.uploadedAt || object.uploaded.toISOString(),
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

export async function handleMemorialBases(request: Request, env: Env): Promise<Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");
  if (!isAdministrator(authenticated.account)) {
    return authError(403, "Somente o administrador pode gerenciar as bases do Memorial Descritivo.");
  }

  if (request.method === "GET") {
    const objects = await listBaseObjects(env);
    const files = objects.map(recordFromObject)
      .sort((left, right) => right.uploadedAt.localeCompare(left.uploadedAt));
    return authJson(200, { files });
  }

  if (request.method !== "POST") return authError(405, "Método não permitido.");
  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_BASE_FILE_BYTES + 128 * 1024) {
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
  if (!ALLOWED_EXTENSIONS.has(extensionOf(filename))) {
    return authError(400, "Envie PDF, Word, Excel, CSV, TSV ou TXT.");
  }
  if (file.size <= 0 || file.size > MAX_BASE_FILE_BYTES) {
    return authError(413, "Cada arquivo-base deve ter no máximo 10 MB.");
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

  return authJson(201, {
    file: { id, filename, contentType, sizeBytes: file.size, uploadedAt },
  });
}

export async function handleMemorialBaseMutation(
  request: Request,
  env: Env,
  baseId: string,
): Promise<Response> {
  if (request.method !== "DELETE") return authError(405, "Método não permitido.");
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");
  if (!isAdministrator(authenticated.account)) {
    return authError(403, "Somente o administrador pode gerenciar as bases do Memorial Descritivo.");
  }
  await env.DOCUMENTS.delete(`${MEMORIAL_BASE_PREFIX}${baseId}`);
  return authJson(200, { deleted: true });
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 32_768) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 32_768));
  }
  return btoa(binary);
}

export async function loadMemorialBaseInputFiles(env: Env): Promise<OpenAIInputFile[]> {
  const objects = await listBaseObjects(env);
  const files: OpenAIInputFile[] = [];
  for (const metadata of objects.slice(0, MAX_BASE_FILES)) {
    const object = await env.DOCUMENTS.get(metadata.key);
    if (!object) continue;
    const filename = metadata.customMetadata?.originalFilename || "arquivo-base";
    const contentType = metadata.httpMetadata?.contentType || metadata.customMetadata?.contentType || "application/octet-stream";
    files.push({
      type: "input_file",
      filename,
      file_data: `data:${contentType};base64,${arrayBufferToBase64(await object.arrayBuffer())}`,
    });
  }
  return files;
}
