import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkRate, clearRateLimitStore } from "./rate-limit";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Advance fake clock by `ms` milliseconds. */
function tick(ms: number) {
  vi.setSystemTime(new Date(Date.now() + ms));
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  clearRateLimitStore();
});

afterEach(() => {
  clearRateLimitStore();
  vi.useRealTimers();
});

// ─── Basic token bucket ───────────────────────────────────────────────────────

describe("checkRate · basic bucket", () => {
  it("first request is ok and returns remaining = limit-1", () => {
    const r = checkRate("test", "user1", { limit: 5, windowMs: 60_000 });
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(4);
    expect(r.limit).toBe(5);
    expect(r.retryAfterSec).toBe(0);
  });

  it("consecutive requests decrement remaining", () => {
    checkRate("test", "u", { limit: 5, windowMs: 60_000 });
    checkRate("test", "u", { limit: 5, windowMs: 60_000 });
    const r = checkRate("test", "u", { limit: 5, windowMs: 60_000 });
    expect(r.ok).toBe(true);
    expect(r.remaining).toBe(2);
  });

  it("exhausts limit and returns ok=false", () => {
    const opts = { limit: 3, windowMs: 60_000 };
    checkRate("scope", "k", opts);
    checkRate("scope", "k", opts);
    checkRate("scope", "k", opts);
    const r = checkRate("scope", "k", opts);
    expect(r.ok).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });

  it("ok=false response includes positive retryAfterSec", () => {
    const opts = { limit: 1, windowMs: 30_000 };
    checkRate("x", "k", opts); // consume the 1 token
    const r = checkRate("x", "k", opts);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThanOrEqual(1);
  });
});

// ─── Refill after elapsed time ────────────────────────────────────────────────

describe("checkRate · token refill", () => {
  it("full window elapsed → tokens fully refilled", () => {
    const opts = { limit: 5, windowMs: 60_000 };
    // Exhaust all tokens
    for (let i = 0; i < 5; i++) checkRate("r", "u", opts);
    expect(checkRate("r", "u", opts).ok).toBe(false);

    // Advance a full window
    tick(60_000);

    const r = checkRate("r", "u", opts);
    expect(r.ok).toBe(true);
  });

  it("half window elapsed → partial refill", () => {
    const opts = { limit: 4, windowMs: 40_000 };
    // Consume 4 tokens
    for (let i = 0; i < 4; i++) checkRate("p", "u", opts);
    expect(checkRate("p", "u", opts).ok).toBe(false);

    // Advance half window → refill 2 tokens
    tick(20_000);

    const r = checkRate("p", "u", opts);
    expect(r.ok).toBe(true);  // 2 tokens available, consume 1
  });

  it("tiny elapsed → not enough refill to allow another request at limit=1", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    checkRate("t", "u", opts); // consume token
    tick(1_000); // only 1/60 of window
    const r = checkRate("t", "u", opts);
    expect(r.ok).toBe(false);
  });
});

// ─── Scope and key isolation ──────────────────────────────────────────────────

describe("checkRate · isolation", () => {
  const opts = { limit: 2, windowMs: 60_000 };

  it("different scopes are independent", () => {
    checkRate("scope_a", "user", opts);
    checkRate("scope_a", "user", opts);
    // scope_a exhausted for user
    expect(checkRate("scope_a", "user", opts).ok).toBe(false);
    // scope_b not touched
    expect(checkRate("scope_b", "user", opts).ok).toBe(true);
  });

  it("different keys within same scope are independent", () => {
    checkRate("scope", "user1", opts);
    checkRate("scope", "user1", opts);
    expect(checkRate("scope", "user1", opts).ok).toBe(false);
    // user2 untouched
    expect(checkRate("scope", "user2", opts).ok).toBe(true);
  });
});

// ─── clearRateLimitStore ──────────────────────────────────────────────────────

describe("clearRateLimitStore", () => {
  it("resets exhausted bucket so next request succeeds", () => {
    const opts = { limit: 1, windowMs: 60_000 };
    checkRate("s", "k", opts);
    expect(checkRate("s", "k", opts).ok).toBe(false);

    clearRateLimitStore();

    expect(checkRate("s", "k", opts).ok).toBe(true);
  });
});

// ─── Rate-limit math ──────────────────────────────────────────────────────────

describe("checkRate · resetMs", () => {
  it("resetMs on first request equals windowMs", () => {
    const opts = { limit: 5, windowMs: 60_000 };
    const r = checkRate("q", "u", opts);
    expect(r.resetMs).toBe(60_000);
  });
});
