// src/lib/rateLimit.ts
// High-performance Sliding Window Rate Limiter (Edge & Node.js Compatible)
// Enforces rate limits (e.g., 5 requests per 60 seconds per IP/identifier).

interface RateLimitRecord {
  timestamps: number[];
}

const tracker = new Map<string, RateLimitRecord>();

let lastCleanup = Date.now();
function cleanupExpired(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < 15000) return;
  lastCleanup = now;

  for (const [key, record] of tracker.entries()) {
    record.timestamps = record.timestamps.filter((t) => now - t < windowMs);
    if (record.timestamps.length === 0) {
      tracker.delete(key);
    }
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
  resetTime: number;
}

/**
 * Checks and records an action under a sliding-window rate limit.
 * @param identifier Unique key (IP address, user ID, or token)
 * @param limit Maximum allowed requests in the time window (default: 5)
 * @param windowMs Time window in milliseconds (default: 60,000ms = 1 minute)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 60 * 1000
): RateLimitResult {
  const now = Date.now();
  cleanupExpired(windowMs);

  let record = tracker.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    tracker.set(identifier, record);
  }

  // Filter timestamps within the sliding window
  record.timestamps = record.timestamps.filter((t) => now - t < windowMs);

  const resetTime = record.timestamps.length > 0 ? record.timestamps[0] + windowMs : now + windowMs;
  const resetSeconds = Math.max(1, Math.ceil((resetTime - now) / 1000));

  if (record.timestamps.length >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
      resetTime,
    };
  }

  // Record current request timestamp
  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);

  return {
    success: true,
    limit,
    remaining,
    resetSeconds,
    resetTime,
  };
}

/**
 * Resets the in-memory rate limiter (useful for unit testing).
 */
export function resetRateLimits() {
  tracker.clear();
}
