export const RATE_LIMIT_MAX = 3;
export const RATE_LIMIT_WINDOW_MS = 3000;

/**
 * Sliding-window rate limiter: allow at most `max` events in the last `windowMs`.
 * Prunes `timestamps` in place, so callers can drop customers whose list empties.
 */
export function pruneWindow(
  timestamps: number[],
  now: number,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
): void {
  const cutoff = now - windowMs;
  // Keep only attempts inside (cutoff, now]. Anything "in the future" means the
  // clock went backwards, so drop it rather than locking the customer out.
  let write = 0;
  for (const t of timestamps) {
    if (t > cutoff && t <= now) {
      timestamps[write] = t;
      write += 1;
    }
  }
  timestamps.length = write;
}

export function isRateLimited(
  timestamps: number[],
  now: number,
  max: number = RATE_LIMIT_MAX,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
): boolean {
  pruneWindow(timestamps, now, windowMs);
  return timestamps.length >= max;
}

export function recordAttempt(timestamps: number[], now: number): void {
  timestamps.push(now);
}
