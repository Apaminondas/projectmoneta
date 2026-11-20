import { NextRequest, NextResponse } from "next/server";
import {
  BackendTimeoutError,
  DemoSessionUnavailableError,
  applyBffSecretHeader,
  checkSlidingWindowRateLimit,
  getBackendBaseOrigin,
  getDemoMode,
  getDemoServiceToken,
  invalidateDemoToken,
  resolveClientKey,
} from "@/lib/server/demo-session";

export const dynamic = "force-dynamic";

const ALLOWED_METHODS = new Set(["GET", "HEAD", "POST", "PUT", "DELETE"]);
const STATE_MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const MAX_SANDBOX_BODY_BYTES = 64 * 1024; // 64 KB

const ALLOWED_API_RESOURCES = new Set([
  "summary",
  "reports",
  "transactions",
  "categories",
  "accounts",
  "contacts",
  "budget",
  "forecast",
  "users",
  "notifications",
  "search",
]);

const ALLOWED_QUERY_KEYS = new Set([
  "year",
  "month",
  "startDate",
  "endDate",
  "categoryId",
  "tier",
  "q",
  "includeArchived",
  "timeframe",
  "unreadOnly",
  "type",
  "page",
  "size",
]);

const SAFE_SEGMENT_REGEX = /^[a-zA-Z0-9:_-]+$/;

function jsonNoStore(
  body: Record<string, unknown>,
  status: number,
  extraHeaders?: Record<string, string>
): NextResponse {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

function getExpectedHost(request: NextRequest): string | undefined {
  const trustProxy = process.env.TRUST_PROXY?.trim().toLowerCase() === "true";
  if (trustProxy) {
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();
    if (forwardedHost) {
      return forwardedHost;
    }
  }
  return request.headers.get("host")?.trim();
}

function isOriginMatchingHost(origin: string, expectedHost?: string): boolean {
  if (!expectedHost) {
    return false;
  }
  try {
    return new URL(origin).host === expectedHost;
  } catch {
    return false;
  }
}

function hasMaliciousRawUrl(rawUrl: string): boolean {
  const schemeIdx = rawUrl.indexOf("://");
  const pathStart = schemeIdx >= 0 ? rawUrl.indexOf("/", schemeIdx + 3) : 0;
  if (pathStart < 0) return true;

  const queryIdx = rawUrl.indexOf("?", pathStart);
  const rawPath =
    queryIdx >= 0
      ? rawUrl.slice(pathStart, queryIdx)
      : rawUrl.slice(pathStart);
  const rawQuery = queryIdx >= 0 ? rawUrl.slice(queryIdx + 1) : "";

  if (
    rawPath.includes("..") ||
    rawPath.includes("//") ||
    rawPath.includes("\\") ||
    /%2e/i.test(rawPath) ||
    /%2f/i.test(rawPath) ||
    /%5c/i.test(rawPath) ||
    /%00/i.test(rawPath) ||
    /[\x00-\x1f\x7f]/.test(rawPath)
  ) {
    return true;
  }

  if (
    rawQuery &&
    (/[\x00-\x1f\x7f]/.test(rawQuery) ||
      /%00/i.test(rawQuery) ||
      /%2e%2e/i.test(rawQuery) ||
      rawQuery.includes("..") ||
      rawQuery.includes("\\"))
  ) {
    return true;
  }

  return false;
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function fetchUpstreamWithToken(params: {
  targetUrl: string;
  method: string;
  token: string;
  contentType: string | null;
  accept: string | null;
  bodyBuffer?: ArrayBuffer;
  timeoutMs: number;
}): Promise<Response> {
  const upstreamHeaders = new Headers();
  upstreamHeaders.set("Authorization", `Bearer ${params.token}`);
  applyBffSecretHeader(upstreamHeaders);

  if (params.contentType) {
    upstreamHeaders.set("Content-Type", params.contentType);
  }
  if (params.accept) {
    upstreamHeaders.set("Accept", params.accept);
  }

  try {
    return await fetch(params.targetUrl, {
      method: params.method,
      headers: upstreamHeaders,
      body: params.bodyBuffer,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(params.timeoutMs),
    });
  } catch (err) {
    if (
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError")
    ) {
      throw new BackendTimeoutError();
    }
    throw new DemoSessionUnavailableError();
  }
}

async function handleProxy(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  const secFetchSite = request.headers
    .get("sec-fetch-site")
    ?.trim()
    .toLowerCase();
  if (secFetchSite === "cross-site") {
    return jsonNoStore({ message: "Acesso cross-site não permitido" }, 403);
  }

  const method = request.method.toUpperCase();
  const isStateMutating = STATE_MUTATING_METHODS.has(method);
  const originHeader = request.headers.get("origin");
  const expectedHost = getExpectedHost(request);

  if (isStateMutating && originHeader && !isOriginMatchingHost(originHeader, expectedHost)) {
    return jsonNoStore({ message: "Origem não permitida" }, 403);
  }

  if (hasMaliciousRawUrl(request.url)) {
    return jsonNoStore({ message: "Não encontrado" }, 404);
  }

  const resolvedParams = await context.params;
  const segments = resolvedParams?.path;

  if (!Array.isArray(segments) || segments.length === 0) {
    return jsonNoStore({ message: "Não encontrado" }, 404);
  }

  for (const segment of segments) {
    if (
      !segment ||
      segment === "." ||
      segment === ".." ||
      segment.includes("/") ||
      segment.includes("\\") ||
      /[\x00-\x1f\x7f]/.test(segment)
    ) {
      return jsonNoStore({ message: "Não encontrado" }, 404);
    }
  }

  const demoMode = getDemoMode();
  if (demoMode === "readonly" && method !== "GET" && method !== "HEAD") {
    return jsonNoStore(
      {
        code: "DEMO_READ_ONLY",
        message: "Modo demonstração: somente leitura.",
      },
      403
    );
  }

  if (isStateMutating && (!originHeader || !isOriginMatchingHost(originHeader, expectedHost))) {
    return jsonNoStore({ message: "Origem não permitida" }, 403);
  }

  if (!ALLOWED_METHODS.has(method)) {
    return jsonNoStore({ message: "Não encontrado" }, 404);
  }

  if (
    segments.length < 2 ||
    segments.length > 5 ||
    segments[0] !== "api" ||
    !ALLOWED_API_RESOURCES.has(segments[1])
  ) {
    return jsonNoStore({ message: "Não encontrado" }, 404);
  }

  for (let i = 2; i < segments.length; i++) {
    if (!SAFE_SEGMENT_REGEX.test(segments[i]) || segments[i].length > 128) {
      return jsonNoStore({ message: "Caminho inválido" }, 400);
    }
  }

  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (
      !ALLOWED_QUERY_KEYS.has(key) ||
      value.length > 200 ||
      /[\x00-\x1f\x7f]/.test(value)
    ) {
      return jsonNoStore({ message: "Parâmetros inválidos" }, 400);
    }
    if (key !== "q" && (value.includes("://") || value.includes("@"))) {
      return jsonNoStore({ message: "Parâmetros inválidos" }, 400);
    }
  }

  const lastSegment = segments[segments.length - 1];
  const isPdfEndpoint =
    segments[1] === "reports" &&
    (lastSegment === "pdf" || lastSegment === "download");
  const isHeavyEndpoint = isPdfEndpoint;

  const clientKey = resolveClientKey(request.headers);
  const rateCheck = checkSlidingWindowRateLimit({
    clientKey,
    isHeavyEndpoint,
    isWriteOperation: isStateMutating,
  });

  if (!rateCheck.allowed) {
    return jsonNoStore(
      { message: "Limite de requisições excedido. Tente novamente em instantes." },
      429,
      { "Retry-After": String(rateCheck.retryAfterSeconds) }
    );
  }

  let bodyBuffer: ArrayBuffer | undefined;
  if (method !== "GET" && method !== "HEAD") {
    const contentLengthHeader = request.headers.get("content-length");
    if (contentLengthHeader) {
      const declaredLength = Number(contentLengthHeader);
      if (Number.isFinite(declaredLength) && declaredLength > MAX_SANDBOX_BODY_BYTES) {
        return jsonNoStore(
          { message: "Tamanho máximo de 64 KB excedido." },
          413
        );
      }
    }

    const rawBody = await request.arrayBuffer();
    if (rawBody.byteLength > MAX_SANDBOX_BODY_BYTES) {
      return jsonNoStore(
        { message: "Tamanho máximo de 64 KB excedido." },
        413
      );
    }
    if (rawBody.byteLength > 0) {
      bodyBuffer = rawBody;
    }
  }

  let backendOrigin: string;
  try {
    backendOrigin = getBackendBaseOrigin();
  } catch {
    return jsonNoStore(
      { message: "Demonstração temporariamente indisponível" },
      503
    );
  }

  const encodedPath = "/" + segments.map((s) => encodeURIComponent(s)).join("/");
  const targetUrl = new URL(encodedPath, backendOrigin);

  if (
    targetUrl.origin !== backendOrigin ||
    !targetUrl.pathname.startsWith("/api/")
  ) {
    return jsonNoStore({ message: "Não encontrado" }, 404);
  }

  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    targetUrl.searchParams.append(key, value);
  }

  const contentType = request.headers.get("content-type");
  const accept = request.headers.get("accept");
  const timeoutMs = isPdfEndpoint ? 30_000 : 10_000;

  let upstreamResponse: Response;
  try {
    let token = await getDemoServiceToken(false);
    upstreamResponse = await fetchUpstreamWithToken({
      targetUrl: targetUrl.toString(),
      method,
      token,
      contentType,
      accept,
      bodyBuffer,
      timeoutMs,
    });

    if (upstreamResponse.status === 401) {
      invalidateDemoToken(token);
      token = await getDemoServiceToken(true);
      upstreamResponse = await fetchUpstreamWithToken({
        targetUrl: targetUrl.toString(),
        method,
        token,
        contentType,
        accept,
        bodyBuffer,
        timeoutMs,
      });
    }
  } catch (err) {
    if (err instanceof BackendTimeoutError) {
      return jsonNoStore({ message: "Tempo esgotado" }, 504);
    }
    return jsonNoStore(
      { message: "Demonstração temporariamente indisponível" },
      503
    );
  }

  if (upstreamResponse.status === 401) {
    return jsonNoStore(
      { message: "Demonstração temporariamente indisponível" },
      503
    );
  }

  if (upstreamResponse.status >= 500) {
    return jsonNoStore({ message: "Erro interno" }, upstreamResponse.status);
  }

  const responseHeaders = new Headers();
  responseHeaders.set("Cache-Control", "no-store");

  const upstreamContentType = upstreamResponse.headers.get("content-type");
  if (upstreamContentType) {
    responseHeaders.set("Content-Type", upstreamContentType);
  }

  const upstreamDisposition = upstreamResponse.headers.get("content-disposition");
  if (upstreamDisposition) {
    responseHeaders.set("Content-Disposition", upstreamDisposition);
  }

  if (upstreamResponse.status === 204) {
    return new NextResponse(null, {
      status: 204,
      headers: responseHeaders,
    });
  }

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  return handleProxy(request, context);
}

export async function HEAD(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  return handleProxy(request, context);
}

export async function POST(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  return handleProxy(request, context);
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  return handleProxy(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  return handleProxy(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse> {
  return handleProxy(request, context);
}
