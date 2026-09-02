import {
  createGeneratedDocument,
  deleteGeneratedDocument,
  getGeneratedDocument,
  listGeneratedDocuments,
  renameGeneratedDocument,
  type GeneratedDocument,
} from "../db/documents";
import { authenticateRequest, authError, authJson } from "./auth";

const DOCX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const MAX_DOCUMENT_BYTES = 50 * 1024 * 1024;
const MAX_MUTATION_BODY_BYTES = 4 * 1024;
const DOCUMENT_TYPES = new Set([
  "Parecer técnico",
  "Relatório fotográfico",
  "Folha de cota",
  "Memorando",
  "Ofício",
  "Notificação",
  "Advertência",
]);

export async function handleDocuments(request: Request, env: Env): Promise<Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");

  if (request.method === "GET") {
    const documents = await listGeneratedDocuments(env.DB, authenticated.account.id);
    return authJson(200, { documents });
  }

  if (request.method !== "POST") return authError(405, "Método não permitido.");

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_DOCUMENT_BYTES + 128 * 1024) {
    return authError(413, "O documento é maior que o limite de 50 MB.");
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return authError(400, "Não foi possível receber o documento.");
  }

  const file = form.get("file");
  const documentType = cleanText(form.get("documentType"), 80);
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".docx")) {
    return authError(400, "Envie um arquivo Word válido.");
  }
  if (!DOCUMENT_TYPES.has(documentType)) {
    return authError(400, "Tipo de documento inválido.");
  }
  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) {
    return authError(413, "O documento deve ter no máximo 50 MB.");
  }

  const id = crypto.randomUUID();
  const filename = safeFilename(file.name);
  const objectKey = `documents/${authenticated.account.id}/${id}.docx`;
  const createdAt = Math.floor(Date.now() / 1000);

  await env.DOCUMENTS.put(objectKey, file.stream(), {
    httpMetadata: {
      contentType: DOCX_CONTENT_TYPE,
      contentDisposition: downloadDisposition(filename),
    },
    customMetadata: {
      ownerId: authenticated.account.id,
      originalFilename: filename,
    },
  });

  const document: GeneratedDocument = {
    id,
    filename,
    documentType,
    contentType: DOCX_CONTENT_TYPE,
    sizeBytes: file.size,
    createdAt,
  };

  try {
    await createGeneratedDocument(env.DB, {
      ...document,
      userId: authenticated.account.id,
      objectKey,
    });
  } catch (error) {
    await env.DOCUMENTS.delete(objectKey);
    throw error;
  }

  return authJson(201, { document });
}

export async function handleDocumentDownload(
  request: Request,
  env: Env,
  documentId: string,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return authError(405, "Método não permitido.");
  }

  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");

  const document = await getGeneratedDocument(env.DB, authenticated.account.id, documentId);
  if (!document) return authError(404, "Documento não encontrado.");

  const object = await env.DOCUMENTS.get(document.objectKey);
  if (!object) return authError(404, "O arquivo deste documento não está disponível.");

  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "Content-Disposition": downloadDisposition(document.filename),
    "Content-Type": document.contentType || DOCX_CONTENT_TYPE,
    "Content-Length": String(object.size),
    "X-Content-Type-Options": "nosniff",
  });
  if (object.httpEtag) headers.set("ETag", object.httpEtag);

  return new Response(request.method === "HEAD" ? null : object.body, { headers });
}

export async function handleDocumentMutation(
  request: Request,
  env: Env,
  documentId: string,
): Promise<Response> {
  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");

  if (request.method === "PATCH") {
    const declaredLength = Number(request.headers.get("Content-Length") || 0);
    if (declaredLength > MAX_MUTATION_BODY_BYTES) {
      return authError(413, "O novo nome é maior que o limite permitido.");
    }

    let body: unknown;
    try {
      const text = await request.text();
      if (new TextEncoder().encode(text).byteLength > MAX_MUTATION_BODY_BYTES) {
        return authError(413, "O novo nome é maior que o limite permitido.");
      }
      body = JSON.parse(text);
    } catch {
      return authError(400, "Informe um nome de arquivo válido.");
    }

    if (!isObject(body) || typeof body.filename !== "string") {
      return authError(400, "Informe um nome de arquivo válido.");
    }
    if (!body.filename.replace(/\.docx$/i, "").trim()) {
      return authError(400, "Informe um nome de arquivo válido.");
    }
    const filename = safeFilename(body.filename);
    const document = await renameGeneratedDocument(
      env.DB,
      authenticated.account.id,
      documentId,
      filename,
    );
    if (!document) return authError(404, "Documento não encontrado.");
    return authJson(200, { document });
  }

  if (request.method === "DELETE") {
    const document = await deleteGeneratedDocument(env.DB, authenticated.account.id, documentId);
    if (!document) return authError(404, "Documento não encontrado.");
    try {
      await env.DOCUMENTS.delete(document.objectKey);
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "Could not remove generated document object",
          documentId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
    return authJson(200, { deleted: true });
  }

  return authError(405, "Método não permitido.");
}

function cleanText(value: FormDataEntryValue | null, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeFilename(value: string): string {
  const cleaned = Array.from(value, (character) => {
    const code = character.charCodeAt(0);
    return character === "\\" || character === "/" || code <= 31 || code === 127 ? "-" : character;
  }).join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
  const basename = cleaned || "documento.docx";
  return basename.toLowerCase().endsWith(".docx") ? basename : `${basename}.docx`;
}

function downloadDisposition(filename: string): string {
  const ascii = filename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9._ -]/g, "-")
    .replace(/["\\]/g, "-") || "documento.docx";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}
