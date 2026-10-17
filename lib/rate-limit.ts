export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

type RateLimiterOptions = {
  limit: number;
  windowMs: number;
  now?: () => number;
  maxKeys?: number;
};

type Entry = { count: number; resetAt: number };

/**
 * Fixed-window limiter kept in process memory. Each server instance counts on
 * its own, so on serverless the effective limit is per instance. It slows
 * down a runaway client; it is not a distributed quota.
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
  maxKeys = 10_000,
}: RateLimiterOptions) {
  const entries = new Map<string, Entry>();

  function prune(at: number) {
    for (const [key, entry] of entries) {
      if (entry.resetAt <= at) entries.delete(key);
    }
    // If every key is still live, drop the oldest ones rather than grow forever.
    for (const key of entries.keys()) {
      if (entries.size < maxKeys) break;
      entries.delete(key);
    }
  }

  return function check(key: string): RateLimitResult {
    const at = now();
    const entry = entries.get(key);
    if (!entry || entry.resetAt <= at) {
      if (entries.size >= maxKeys) prune(at);
      entries.set(key, { count: 1, resetAt: at + windowMs });
      return { allowed: true };
    }
    if (entry.count >= limit) {
      return {
        allowed: false,
        retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - at) / 1000)),
      };
    }
    entry.count += 1;
    return { allowed: true };
  };
}
