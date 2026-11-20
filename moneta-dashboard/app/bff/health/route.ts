import { NextRequest, NextResponse } from "next/server";
import {
  applyBffSecretHeader,
  checkSlidingWindowRateLimit,
  getBackendBaseOrigin,
  resolveClientKey,
} from "@/lib/server/demo-session";

export const dynamic = "force-dynamic";

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secFetchSite = request.headers
    .get("sec-fetch-site")
    ?.trim()
    .toLowerCase();
  if (secFetchSite === "cross-site") {
    return jsonNoStore({ message: "Acesso cross-site não permitido" }, 403);
  }

  const rate = checkSlidingWindowRateLimit({
    clientKey: resolveClientKey(request.headers),
    isHeavyEndpoint: false,
    isWriteOperation: false,
  });

  if (!rate.allowed) {
    return jsonNoStore(
      { message: "Limite de requisições excedido. Tente novamente em instantes." },
      429,
      { "Retry-After": String(rate.retryAfterSeconds) }
    );
  }

  let backendOrigin: string;
  try {
    backendOrigin = getBackendBaseOrigin();
  } catch {
    return jsonNoStore({ ok: false }, 503);
  }

  try {
    const targetUrl = new URL("/actuator/health", backendOrigin);
    const healthHeaders = new Headers({ Accept: "application/json" });
    applyBffSecretHeader(healthHeaders);
    const upstream = await fetch(targetUrl.toString(), {
      method: "GET",
      headers: healthHeaders,
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });

    if (upstream.ok) {
      return jsonNoStore({ ok: true }, 200);
    }
    return jsonNoStore({ ok: false }, 503);
  } catch {
    return jsonNoStore({ ok: false }, 503);
  }
}
