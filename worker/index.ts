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
import {
  handleAdminUserCardAccess,
  handleAdminUserMutation,
  handleAdminUsers,
} from "./admin";
import { handleDocumentDownload, handleDocumentMutation, handleDocuments } from "./documents";
import { handleSignatureMutation, handleSignatures } from "./signatures";
import {
  handleKanban,
  handleKanbanAttachmentMutation,
  handleKanbanBoardMutation,
  handleKanbanBoards,
  handleKanbanCardAttachments,
  handleKanbanCardComments,
  handleKanbanCardDetails,
  handleKanbanCardMutation,
  handleKanbanCards,
  handleKanbanNotificationMutation,
  handleKanbanNotifications,
  handleKanbanNotificationsRead,
} from "./kanban";

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const PERSONAL_CLOUDFLARE_API_ORIGIN =
  "https://docflow-fiscal-bertioga.lucaspsimoes22.workers.dev";
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

async function proxyApiToPersonalCloudflare(
  request: Request,
  env: Env,
  url: URL,
): Promise<Response | null> {
  const configuredOrigin = (env as Env & { CLOUDFLARE_BACKEND_ORIGIN?: string })
    .CLOUDFLARE_BACKEND_ORIGIN;
  if (!configuredOrigin) return null;
  if (configuredOrigin !== PERSONAL_CLOUDFLARE_API_ORIGIN) {
    throw new Error("CLOUDFLARE_BACKEND_ORIGIN inválida.");
  }

  const target = new URL(`${url.pathname}${url.search}`, PERSONAL_CLOUDFLARE_API_ORIGIN);
  const headers = new Headers(request.headers);
  headers.set("Origin", PERSONAL_CLOUDFLARE_API_ORIGIN);
  headers.set("X-Forwarded-Host", url.host);
  headers.delete("Host");

  return fetch(new Request(target, {
    method: request.method,
    headers,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
  }));
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

      if (url.pathname.startsWith("/api/")) {
        const proxied = await proxyApiToPersonalCloudflare(request, env, url);
        if (proxied) return proxied;
      }

      if (url.pathname === "/api/auth/register") {
        return await handleRegister(request, env);
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
      if (url.pathname === "/api/admin/users") {
        return await handleAdminUsers(request, env);
      }
      const adminUserCardAccess = url.pathname.match(/^\/api\/admin\/users\/([0-9a-f-]{36})\/cards$/i);
      if (adminUserCardAccess) {
        return await handleAdminUserCardAccess(request, env, adminUserCardAccess[1]);
      }
      const adminUserMutation = url.pathname.match(/^\/api\/admin\/users\/([0-9a-f-]{36})$/i);
      if (adminUserMutation) {
        return await handleAdminUserMutation(request, env, adminUserMutation[1]);
      }
      if (url.pathname === "/api/openai") {
        return await proxyOpenAI(request, env);
      }
      if (url.pathname === "/api/kanban") {
        return await handleKanban(request, env);
      }
      if (url.pathname === "/api/kanban/cards") {
        return await handleKanbanCards(request, env);
      }
      if (url.pathname === "/api/kanban/boards") {
        return await handleKanbanBoards(request, env);
      }
      if (url.pathname === "/api/kanban/notifications") {
        return await handleKanbanNotifications(request, env);
      }
      if (url.pathname === "/api/kanban/notifications/read") {
        return await handleKanbanNotificationsRead(request, env);
      }
      const kanbanNotificationMutation = url.pathname.match(/^\/api\/kanban\/notifications\/([0-9a-f-]{36})$/i);
      if (kanbanNotificationMutation) {
        return await handleKanbanNotificationMutation(request, env, kanbanNotificationMutation[1]);
      }
      const kanbanCardDetails = url.pathname.match(/^\/api\/kanban\/cards\/([0-9a-f-]{36})\/details$/i);
      if (kanbanCardDetails) {
        return await handleKanbanCardDetails(request, env, kanbanCardDetails[1]);
      }
      const kanbanCardComments = url.pathname.match(/^\/api\/kanban\/cards\/([0-9a-f-]{36})\/comments$/i);
      if (kanbanCardComments) {
        return await handleKanbanCardComments(request, env, kanbanCardComments[1]);
      }
      const kanbanCardAttachments = url.pathname.match(/^\/api\/kanban\/cards\/([0-9a-f-]{36})\/attachments$/i);
      if (kanbanCardAttachments) {
        return await handleKanbanCardAttachments(request, env, kanbanCardAttachments[1]);
      }
      const kanbanAttachmentDownload = url.pathname.match(/^\/api\/kanban\/cards\/([0-9a-f-]{36})\/attachments\/([0-9a-f-]{36})\/download$/i);
      if (kanbanAttachmentDownload) {
        return await handleKanbanAttachmentMutation(
          request,
          env,
          kanbanAttachmentDownload[1],
          kanbanAttachmentDownload[2],
          true,
        );
      }
      const kanbanAttachmentMutation = url.pathname.match(/^\/api\/kanban\/cards\/([0-9a-f-]{36})\/attachments\/([0-9a-f-]{36})$/i);
      if (kanbanAttachmentMutation) {
        return await handleKanbanAttachmentMutation(
          request,
          env,
          kanbanAttachmentMutation[1],
          kanbanAttachmentMutation[2],
          false,
        );
      }
      const kanbanCardMutation = url.pathname.match(/^\/api\/kanban\/cards\/([0-9a-f-]{36})$/i);
      if (kanbanCardMutation) {
        return await handleKanbanCardMutation(request, env, kanbanCardMutation[1]);
      }
      const kanbanBoardMutation = url.pathname.match(/^\/api\/kanban\/boards\/([0-9a-f-]{36})$/i);
      if (kanbanBoardMutation) {
        return await handleKanbanBoardMutation(request, env, kanbanBoardMutation[1]);
      }
      if (url.pathname === "/api/documents") {
        return await handleDocuments(request, env);
      }
      if (url.pathname === "/api/signatures") {
        return await handleSignatures(request, env);
      }
      const signatureMutation = url.pathname.match(/^\/api\/signatures\/([0-9a-f-]{36})$/i);
      if (signatureMutation) {
        return await handleSignatureMutation(request, env, signatureMutation[1]);
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
