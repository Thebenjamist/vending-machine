export const RATE_LIMIT_MAX = 3;
export const RATE_LIMIT_WINDOW_MS = 3000;

/**
 * Sliding-window rate limiter: allow at most `max` events in the last `windowMs`.
 * Mutates `timestamps` in place (prunes expired entries).
 */
export function isRateLimited(
  timestamps: number[],
  now: number,
  max: number = RATE_LIMIT_MAX,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
): boolean {
  pruneWindow(timestamps, now, windowMs);
  return timestamps.length >= max;
}

export function recordAttempt(
  timestamps: number[],
  now: number,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
): void {
  pruneWindow(timestamps, now, windowMs);
  timestamps.push(now);
}

export function pruneWindow(
  timestamps: number[],
  now: number,
  windowMs: number = RATE_LIMIT_WINDOW_MS,
): void {
  const cutoff = now - windowMs;
  let firstValid = 0;
  while (firstValid < timestamps.length && timestamps[firstValid] <= cutoff) {
    firstValid += 1;
  }
  if (firstValid > 0) {
    timestamps.splice(0, firstValid);
  }
}
