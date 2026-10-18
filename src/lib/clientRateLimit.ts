// src/lib/clientRateLimit.ts
// Client-side rate limiting helper (5 requests per 60 seconds)
// Prevents rapid button clicking and form spam directly in the browser.

export function checkClientRateLimit(
  actionKey: string,
  maxRequests: number = 5,
  windowMs: number = 60000
): { allowed: boolean; retryAfterSec: number } {
  if (typeof window === "undefined") return { allowed: true, retryAfterSec: 0 };

  const storageKey = `ic_rate_${actionKey}`;
  const now = Date.now();
  let timestamps: number[] = [];

  try {
    const raw = sessionStorage.getItem(storageKey);
    if (raw) {
      timestamps = JSON.parse(raw);
    }
  } catch {
    timestamps = [];
  }

  timestamps = timestamps.filter((t) => typeof t === "number" && now - t < windowMs);

  if (timestamps.length >= maxRequests) {
    const oldest = timestamps[0];
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, retryAfterSec };
  }

  timestamps.push(now);
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(timestamps));
  } catch {
    // sessionStorage full or unavailable
  }

  return { allowed: true, retryAfterSec: 0 };
}
