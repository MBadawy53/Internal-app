// Simple in-memory rate limiter. Per-instance; on Vercel each function
// instance keeps its own bucket, so the cap is approximate across the fleet
// — good enough as a first cut to deter casual spam.
// Swap for Redis / Upstash when we need cross-instance accuracy.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/** Sweep expired buckets every so often. Cheap because we only run on access. */
function maybeSweep(now: number) {
  if (buckets.size < 1000) return;
  for (const [k, b] of buckets) {
    if (b.resetAt <= now) buckets.delete(k);
  }
}

/**
 * Returns true if the request is within the limit, false if exceeded.
 * Resets after windowMs.
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  maybeSweep(now);
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}
