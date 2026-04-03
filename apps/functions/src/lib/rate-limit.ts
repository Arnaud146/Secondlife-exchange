import { HttpError } from "./http.js";

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;
const STALE_THRESHOLD_MS = 10 * 60 * 1000;
let lastCleanup = Date.now();

function evictStaleBuckets(now: number) {
  if (now - lastCleanup < STALE_THRESHOLD_MS) return;
  lastCleanup = now;

  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > STALE_THRESHOLD_MS) {
      buckets.delete(key);
    }
  }
}

export function assertWithinRateLimit(params: {
  key: string;
  maxTokens: number;
  refillWindowMs: number;
}) {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    evictStaleBuckets(now);
  }

  const refillRate = params.maxTokens / params.refillWindowMs;

  const bucket = buckets.get(params.key) ?? {
    tokens: params.maxTokens,
    lastRefill: now,
  };

  const elapsed = now - bucket.lastRefill;
  const refilledTokens = elapsed * refillRate;

  bucket.tokens = Math.min(params.maxTokens, bucket.tokens + refilledTokens);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    buckets.set(params.key, bucket);
    throw new HttpError(429, "Rate limit exceeded.");
  }

  bucket.tokens -= 1;
  buckets.set(params.key, bucket);
}
