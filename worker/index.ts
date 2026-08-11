/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const OPENAI_RESPONSES_URL = "https://api.openai.com/v1/responses";
const MAX_OPENAI_REQUEST_BYTES = 12 * 1024 * 1024;

function jsonResponse(status: number, message: string): Response {
  return Response.json(
    { error: { message } },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

async function proxyOpenAI(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse(405, "Método não permitido.");
  }

  const authorization = request.headers.get("Authorization")?.trim();
  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse(401, "Informe uma chave válida da API da OpenAI.");
  }

  const declaredLength = Number(request.headers.get("Content-Length") || 0);
  if (declaredLength > MAX_OPENAI_REQUEST_BYTES) {
    return jsonResponse(413, "A solicitação é maior que o limite permitido.");
  }

  const body = await request.arrayBuffer();
  if (body.byteLength > MAX_OPENAI_REQUEST_BYTES) {
    return jsonResponse(413, "A solicitação é maior que o limite permitido.");
  }

  try {
    const upstream = await fetch(OPENAI_RESPONSES_URL, {
      method: "POST",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body,
    });
    const headers = new Headers({
      "Cache-Control": "no-store",
      "Content-Type": upstream.headers.get("Content-Type") || "application/json",
    });
    const requestId = upstream.headers.get("x-request-id");
    if (requestId) headers.set("x-openai-request-id", requestId);
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return jsonResponse(502, "Não foi possível acessar a OpenAI neste momento.");
  }
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/api/openai") {
      return proxyOpenAI(request);
    }

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      return handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
    }

    return handler.fetch(request, env, ctx);
  },
};

export default worker;
