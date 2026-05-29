// In-memory token-bucket rate limiter.
//
// Без Redis — для MVP достаточно. Истекает с процессом pm2; rotation logs не страшен.
// Для production-нагрузок имеет смысл переехать на Redis / Upstash.
//
// Использование:
//   const r = checkRate("register", ipFromReq(req), { limit: 5, windowMs: 60_000 });
//   if (!r.ok) return rateLimited(r);

import { NextRequest, NextResponse } from "next/server";

interface Bucket {
  tokens: number;
  updatedAt: number;
}

interface Options {
  /** Сколько запросов разрешено в окне */
  limit: number;
  /** Длина окна в миллисекундах */
  windowMs: number;
}

const store = new Map<string, Bucket>();
const GC_INTERVAL_MS = 5 * 60_000;

// Periodically prune old buckets to avoid memory leak.
let gcTimer: NodeJS.Timeout | null = null;
function ensureGc() {
  if (gcTimer) return;
  gcTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, v] of store) {
      if (now - v.updatedAt > 30 * 60_000) store.delete(k);
    }
  }, GC_INTERVAL_MS);
  // unref so it doesn't keep Node process alive on shutdown
  gcTimer.unref?.();
}

export interface RateResult {
  ok: boolean;
  remaining: number;
  resetMs: number; // ms until reset
  retryAfterSec: number; // for 429 header
  limit: number;
}

export function checkRate(scope: string, key: string, opts: Options): RateResult {
  ensureGc();
  const bucketKey = `${scope}|${key}`;
  const now = Date.now();
  const b = store.get(bucketKey);
  if (!b) {
    store.set(bucketKey, { tokens: opts.limit - 1, updatedAt: now });
    return { ok: true, remaining: opts.limit - 1, resetMs: opts.windowMs, retryAfterSec: 0, limit: opts.limit };
  }
  // Refill proportionally to elapsed time.
  const elapsed = now - b.updatedAt;
  if (elapsed > 0) {
    const refill = (elapsed / opts.windowMs) * opts.limit;
    b.tokens = Math.min(opts.limit, b.tokens + refill);
    b.updatedAt = now;
  }
  if (b.tokens < 1) {
    const need = 1 - b.tokens;
    const retryMs = Math.ceil((need / opts.limit) * opts.windowMs);
    return {
      ok: false,
      remaining: 0,
      resetMs: retryMs,
      retryAfterSec: Math.max(1, Math.ceil(retryMs / 1000)),
      limit: opts.limit,
    };
  }
  b.tokens -= 1;
  return {
    ok: true,
    remaining: Math.floor(b.tokens),
    resetMs: opts.windowMs,
    retryAfterSec: 0,
    limit: opts.limit,
  };
}

export function ipFromReq(req: NextRequest): string {
  // За nginx → x-forwarded-for содержит реальный IP клиента.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  // NextRequest.ip может быть undefined в node-runtime; fallback на user-agent для теста.
  return req.headers.get("user-agent") ?? "unknown";
}

/** Clear all buckets — intended for use in unit tests only. */
export function clearRateLimitStore(): void {
  store.clear();
  if (gcTimer) {
    clearInterval(gcTimer);
    gcTimer = null;
  }
}

export function rateLimited(r: RateResult): NextResponse {
  return new NextResponse(
    JSON.stringify({ error: "rate_limited", retry_after_seconds: r.retryAfterSec, limit: r.limit }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(r.retryAfterSec),
        "X-RateLimit-Limit": String(r.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}
