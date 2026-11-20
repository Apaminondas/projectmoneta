/**
 * Gerenciador de sessão de serviço para a demonstração pública (somente servidor).
 *
 * NOTA ARQUITETURAL SOBRE RATE LIMIT EM MEMÓRIA:
 * Os contadores de janela deslizante abaixo operam em memória de processo ("melhor esforço").
 * Em ambientes serverless ou com múltiplas réplicas horizontais, instâncias distintas não
 * compartilham estado em memória; em produção, este controle deve ser complementado por
 * regras de rate limiting na borda (WAF / CDN / Reverse Proxy).
 */

export type DemoMode = "readonly" | "sandbox";

export class DemoSessionUnavailableError extends Error {
  constructor() {
    super("Demonstração temporariamente indisponível");
    this.name = "DemoSessionUnavailableError";
  }
}

export class BackendTimeoutError extends Error {
  constructor() {
    super("Tempo esgotado");
    this.name = "BackendTimeoutError";
  }
}

interface CachedToken {
  token: string;
  expiresAtMs: number;
  refreshAtMs: number;
}

let cachedDemoToken: CachedToken | null = null;
let inflightLoginPromise: Promise<string> | null = null;

export function getDemoMode(): DemoMode {
  const raw = process.env.DEMO_MODE?.trim().toLowerCase();
  return raw === "sandbox" ? "sandbox" : "readonly";
}

export function applyBffSecretHeader(headers: Headers): void {
  const bffSecret = process.env.BFF_SHARED_SECRET?.trim();
  if (bffSecret) {
    headers.set("X-BFF-Secret", bffSecret);
  }
}

export function getBackendBaseOrigin(): string {
  const backendEnv = process.env.BACKEND_URL?.trim();
  if (!backendEnv) {
    throw new DemoSessionUnavailableError();
  }
  try {
    return new URL(backendEnv).origin;
  } catch {
    throw new DemoSessionUnavailableError();
  }
}

function decodeJwtExpMs(token: string, fallbackSeconds?: unknown): number {
  const nowMs = Date.now();

  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        "="
      );
      const payloadJson = Buffer.from(padded, "base64").toString("utf-8");
      const payload = JSON.parse(payloadJson) as { exp?: unknown };
      if (typeof payload.exp === "number" && Number.isFinite(payload.exp)) {
        const expMs = payload.exp * 1000;
        if (expMs > nowMs) {
          return expMs;
        }
      }
    }
  } catch {
    // Continua para fallback abaixo se o payload não puder ser decodificado
  }

  if (
    typeof fallbackSeconds === "number" &&
    Number.isFinite(fallbackSeconds) &&
    fallbackSeconds > 0
  ) {
    return nowMs + Math.floor(fallbackSeconds * 1000);
  }

  return nowMs + 3_600_000;
}

function computeRefreshAtMs(nowMs: number, expiresAtMs: number): number {
  const ttlMs = expiresAtMs - nowMs;
  // Renova 60 segundos antes de expirar para tokens normais;
  // para tokens de teste de curta duração (<= 65s), usa margem proporcional (20%).
  const skewMs = ttlMs > 65_000 ? 60_000 : Math.max(500, Math.floor(ttlMs * 0.2));
  return Math.max(nowMs + 250, expiresAtMs - skewMs);
}

async function performServiceLogin(): Promise<string> {
  const backendOrigin = getBackendBaseOrigin();
  const email = process.env.DEMO_EMAIL?.trim();
  const password = process.env.DEMO_PASSWORD;

  if (!email || !password) {
    throw new DemoSessionUnavailableError();
  }

  const loginUrl = new URL("/api/auth/login", backendOrigin).toString();
  const loginHeaders = new Headers({
    "Content-Type": "application/json",
    Accept: "application/json",
  });
  applyBffSecretHeader(loginHeaders);

  let response: Response;
  try {
    response = await fetch(loginUrl, {
      method: "POST",
      headers: loginHeaders,
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
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

  if (!response.ok) {
    throw new DemoSessionUnavailableError();
  }

  let data: {
    accessToken?: unknown;
    expiresIn?: unknown;
    expiresInSeconds?: unknown;
  };
  try {
    data = (await response.json()) as typeof data;
  } catch {
    throw new DemoSessionUnavailableError();
  }

  if (typeof data?.accessToken !== "string" || !data.accessToken) {
    throw new DemoSessionUnavailableError();
  }

  const nowMs = Date.now();
  const expiresAtMs = decodeJwtExpMs(
    data.accessToken,
    data.expiresIn ?? data.expiresInSeconds
  );

  cachedDemoToken = {
    token: data.accessToken,
    expiresAtMs,
    refreshAtMs: computeRefreshAtMs(nowMs, expiresAtMs),
  };

  return data.accessToken;
}

export async function getDemoServiceToken(forceRefresh = false): Promise<string> {
  const nowMs = Date.now();

  if (
    !forceRefresh &&
    cachedDemoToken &&
    nowMs < cachedDemoToken.refreshAtMs &&
    nowMs < cachedDemoToken.expiresAtMs
  ) {
    return cachedDemoToken.token;
  }

  if (inflightLoginPromise) {
    return inflightLoginPromise;
  }

  inflightLoginPromise = performServiceLogin().finally(() => {
    inflightLoginPromise = null;
  });

  return inflightLoginPromise;
}

export function invalidateDemoToken(tokenToInvalidate?: string): void {
  if (!tokenToInvalidate || cachedDemoToken?.token === tokenToInvalidate) {
    cachedDemoToken = null;
  }
}

// ============================================================================
// Rate Limiter em memória por janela deslizante (60 segundos) — Melhor esforço
// ============================================================================

const WINDOW_MS = 60_000;
const GENERAL_LIMIT_PER_MIN =
  process.env.RATE_LIMIT_GENERAL_PER_MIN != null
    ? Number(process.env.RATE_LIMIT_GENERAL_PER_MIN)
    : 300;
const HEAVY_LIMIT_PER_MIN =
  process.env.RATE_LIMIT_HEAVY_PER_MIN != null
    ? Number(process.env.RATE_LIMIT_HEAVY_PER_MIN)
    : 60;
const SANDBOX_WRITE_LIMIT_PER_MIN =
  process.env.RATE_LIMIT_WRITE_PER_MIN != null
    ? Number(process.env.RATE_LIMIT_WRITE_PER_MIN)
    : 30;
const CLEANUP_INTERVAL_MS = 30_000;
const MAX_TRACKED_KEYS = 2_000;

const slidingWindowStore = new Map<string, number[]>();
let lastCleanupMs = Date.now();

function cleanupExpiredEntries(nowMs: number): void {
  if (
    nowMs - lastCleanupMs < CLEANUP_INTERVAL_MS &&
    slidingWindowStore.size < MAX_TRACKED_KEYS
  ) {
    return;
  }
  lastCleanupMs = nowMs;
  const cutoff = nowMs - WINDOW_MS;

  for (const [key, timestamps] of slidingWindowStore.entries()) {
    const valid = timestamps.filter((t) => t > cutoff);
    if (valid.length === 0) {
      slidingWindowStore.delete(key);
    } else {
      slidingWindowStore.set(key, valid);
    }
  }
}

export function resolveClientKey(headers: Headers): string {
  const trustProxy = process.env.TRUST_PROXY?.trim().toLowerCase() === "true";
  if (trustProxy) {
    const xff = headers.get("x-forwarded-for");
    if (xff) {
      const firstIp = xff.split(",")[0]?.trim();
      if (firstIp && firstIp.length <= 64) {
        return `ip:${firstIp}`;
      }
    }
  }
  return "local:single-node";
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

export function checkSlidingWindowRateLimit(params: {
  clientKey: string;
  isHeavyEndpoint: boolean;
  isWriteOperation: boolean;
}): RateLimitResult {
  if (
    process.env.RATE_LIMIT_DISABLED === "true" ||
    process.env.NODE_ENV === "test"
  ) {
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const nowMs = Date.now();
  cleanupExpiredEntries(nowMs);
  const cutoff = nowMs - WINDOW_MS;

  const checks: Array<{ bucketKey: string; limit: number }> = [
    {
      bucketKey: `gen:${params.clientKey}`,
      limit: GENERAL_LIMIT_PER_MIN,
    },
  ];

  if (params.isHeavyEndpoint) {
    checks.push({
      bucketKey: `heavy:${params.clientKey}`,
      limit: HEAVY_LIMIT_PER_MIN,
    });
  }

  if (params.isWriteOperation) {
    checks.push({
      bucketKey: `write:${params.clientKey}`,
      limit: SANDBOX_WRITE_LIMIT_PER_MIN,
    });
  }

  const prunedLists: Array<{ bucketKey: string; list: number[] }> = [];

  for (const check of checks) {
    const existing = slidingWindowStore.get(check.bucketKey) ?? [];
    const active = existing.filter((t) => t > cutoff);

    if (active.length >= check.limit) {
      slidingWindowStore.set(check.bucketKey, active);
      const oldest = active[0] ?? nowMs;
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((oldest + WINDOW_MS - nowMs) / 1000)
      );
      return { allowed: false, retryAfterSeconds };
    }

    prunedLists.push({ bucketKey: check.bucketKey, list: active });
  }

  for (const item of prunedLists) {
    item.list.push(nowMs);
    slidingWindowStore.set(item.bucketKey, item.list);
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

