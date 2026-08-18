/** Cloudflare Worker entry point for the DocFlow application. */
import {
  DEFAULT_DEVICE_SIZES,
  DEFAULT_IMAGE_SIZES,
  handleImageOptimization,
} from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";
import {
  authenticateRequest,
  authError,
  handleApiKey,
  handleLogin,
  handleLogout,
  handleRegister,
  handleSession,
  openAICredentialForUser,
} from "./auth";
import { handleDocumentDownload, handleDocumentMutation, handleDocuments } from "./documents";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MAX_OPENAI_REQUEST_BYTES = 12 * 1024 * 1024;

type OpenAIRequestBody = {
  input?: unknown;
  max_output_tokens?: unknown;
  reasoning?: unknown;
  text?: unknown;
};

async function proxyOpenAI(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") return authError(405, "Método não permitido.");

  const authenticated = await authenticateRequest(request, env);
  if (!authenticated) return authError(401, "Sua sessão expirou. Entre novamente.");

  const credential = await openAICredentialForUser(env, authenticated.account.id);
  if (!credential) {
    return authError(400, "Cadastre sua chave da API da OpenAI antes de usar a análise.");
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_OPENAI_REQUEST_BYTES) {
    return authError(413, "A solicitação é maior que o limite permitido.");
  }

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_OPENAI_REQUEST_BYTES) {
    return authError(413, "A solicitação é maior que o limite permitido.");
  }

  let input: OpenAIRequestBody;
  try {
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (!isObject(parsed)) return authError(400, "Solicitação inválida.");
    input = parsed;
  } catch {
    return authError(400, "Solicitação inválida.");
  }

  if (!Array.isArray(input.input) || input.input.length === 0) {
    return authError(400, "Informe o conteúdo que será analisado.");
  }

  const upstreamBody: Record<string, unknown> = {
    model: credential.model,
    input: input.input,
    max_output_tokens: boundedOutputTokens(input.max_output_tokens),
    safety_identifier: `docflow-${authenticated.account.id}`,
  };
  if (isObject(input.reasoning)) upstreamBody.reasoning = input.reasoning;
  if (isObject(input.text)) upstreamBody.text = input.text;

  try {
    const upstream = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${credential.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
    });
    const headers = new Headers({
      "Cache-Control": "no-store",
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
    });
    const requestId = upstream.headers.get("x-request-id");
    if (requestId) headers.set("x-openai-request-id", requestId);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return authError(502, "Não foi possível acessar a OpenAI neste momento.");
  }
}

function boundedOutputTokens(value: unknown): number {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 600;
  return Math.min(2_000, Math.max(16, Math.round(numeric)));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function imageOutputFormat(
  value: string,
): "image/jpeg" | "image/png" | "image/gif" | "image/webp" | "image/avif" {
  if (value === "image/jpeg" || value === "image/png" || value === "image/gif" || value === "image/avif") {
    return value;
  }
  return "image/webp";
}

function isUnsafeMethod(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("Origin");
  if (origin) return origin === new URL(request.url).origin;
  const fetchSite = request.headers.get("Sec-Fetch-Site");
  return fetchSite === "same-origin" || fetchSite === "none";
}

function isDocFlowRootRequest(request: Request, url: URL): boolean {
  return (
    (request.method === "GET" || request.method === "HEAD") &&
    (url.pathname === "/" || url.pathname === "/index.html")
  );
}

type MigrationDocument = {
  object_key: string;
  filename: string;
  content_type: string;
  size_bytes: number;
};

async function handleMigrationDocumentExport(
  request: Request,
  env: Env,
  documentId: string,
): Promise<Response> {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return authError(405, "Método não permitido.");
  }

  const configuredToken = (env as Env & { MIGRATION_EXPORT_TOKEN?: string }).MIGRATION_EXPORT_TOKEN;
  const authorization = request.headers.get("Authorization") || "";
  const providedToken = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  if (!configuredToken || providedToken !== configuredToken) {
    return authError(404, "Documento não encontrado.");
  }

  const document = await env.DB.prepare(
    `SELECT object_key, filename, content_type, size_bytes
       FROM generated_documents
      WHERE id = ?
      LIMIT 1`,
  )
    .bind(documentId)
    .first<MigrationDocument>();
  if (!document) return authError(404, "Documento não encontrado.");

  const object = await env.DOCUMENTS.get(document.object_key);
  if (!object) return authError(404, "O arquivo deste documento não está disponível.");

  return new Response(request.method === "HEAD" ? null : object.body, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Length": String(object.size),
      "Content-Type": document.content_type,
      "X-Content-Type-Options": "nosniff",
    },
  });
}

async function serveDocFlowAtRoot(request: Request, env: Env): Promise<Response> {
  const assetUrl = new URL("/docflow/", request.url);
  const assetResponse = await env.ASSETS.fetch(new Request(assetUrl, request));
  const headers = new Headers(assetResponse.headers);
  headers.set("Content-Location", "/");

  return new Response(assetResponse.body, {
    status: assetResponse.status,
    statusText: assetResponse.statusText,
    headers,
  });
}

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/") && isUnsafeMethod(request.method)) {
        if (!isSameOriginRequest(request)) {
          return authError(403, "Solicitação bloqueada por segurança.");
        }
      }

      if (url.pathname === "/api/auth/register") {
        return await handleRegister(request, env, ctx);
      }
      if (url.pathname === "/api/auth/login") {
        return await handleLogin(request, env, ctx);
      }
      if (url.pathname === "/api/auth/logout") {
        return await handleLogout(request, env);
      }
      if (url.pathname === "/api/auth/session") {
        return await handleSession(request, env);
      }
      if (url.pathname === "/api/account/api-key") {
        return await handleApiKey(request, env);
      }
      if (url.pathname === "/api/openai") {
        return await proxyOpenAI(request, env);
      }
      if (url.pathname === "/api/documents") {
        return await handleDocuments(request, env);
      }
      const migrationDocumentExport = url.pathname.match(
        /^\/api\/migration\/documents\/([0-9a-f-]{36})$/i,
      );
      if (migrationDocumentExport) {
        return await handleMigrationDocumentExport(request, env, migrationDocumentExport[1]);
      }
      const documentDownload = url.pathname.match(/^\/api\/documents\/([0-9a-f-]{36})\/download$/i);
      if (documentDownload) {
        return await handleDocumentDownload(request, env, documentDownload[1]);
      }
      const documentMutation = url.pathname.match(/^\/api\/documents\/([0-9a-f-]{36})$/i);
      if (documentMutation) {
        return await handleDocumentMutation(request, env, documentMutation[1]);
      }

      if (isDocFlowRootRequest(request, url)) {
        return await serveDocFlowAtRoot(request, env);
      }

      if (url.pathname === "/_vinext/image") {
        const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
        return await handleImageOptimization(
          request,
          {
            fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
            transformImage: async (body, { width, format, quality }) => {
              const result = await env.IMAGES.input(body)
                .transform(width > 0 ? { width } : {})
                .output({ format: imageOutputFormat(format), quality });
              return result.response();
            },
          },
          allowedWidths,
        );
      }

      return await handler.fetch(request, env, ctx);
    } catch (error) {
      console.error(
        JSON.stringify({
          message: "DocFlow request failed",
          path: url.pathname,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
      return authError(500, "Não foi possível concluir a solicitação agora.");
    }
  },
} satisfies ExportedHandler<Env>;

export default worker;
