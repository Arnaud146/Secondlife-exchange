import { HttpError } from "./http.js";

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

export function assertWithinRateLimit(params: {
  key: string;
  maxTokens: number;
  refillWindowMs: number;
}) {
  const now = Date.now();
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
