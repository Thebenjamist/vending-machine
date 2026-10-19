import {
  isRateLimited,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  recordAttempt,
} from "@/lib/rateLimit";

describe("rateLimit", () => {
  it("allows up to three attempts inside the window", () => {
    const timestamps: number[] = [];
    const t0 = 1_000_000;

    expect(isRateLimited(timestamps, t0)).toBe(false);
    recordAttempt(timestamps, t0);
    recordAttempt(timestamps, t0 + 10);
    recordAttempt(timestamps, t0 + 20);

    expect(timestamps).toHaveLength(RATE_LIMIT_MAX);
    expect(isRateLimited(timestamps, t0 + 30)).toBe(true);
  });

  it("allows another attempt after the window expires", () => {
    const timestamps: number[] = [];
    const t0 = 1_000_000;

    recordAttempt(timestamps, t0);
    recordAttempt(timestamps, t0 + 1);
    recordAttempt(timestamps, t0 + 2);

    expect(isRateLimited(timestamps, t0 + RATE_LIMIT_WINDOW_MS + 1)).toBe(false);
  });

  it("tracks customers independently when maps are separate", () => {
    const alice: number[] = [];
    const bob: number[] = [];
    const now = 5_000;

    recordAttempt(alice, now);
    recordAttempt(alice, now + 1);
    recordAttempt(alice, now + 2);

    expect(isRateLimited(alice, now + 3)).toBe(true);
    expect(isRateLimited(bob, now + 3)).toBe(false);
  });
});

describe("rateLimit edge cases", () => {
  it("frees a slot exactly when the oldest attempt is 3 seconds old", () => {
    const timestamps: number[] = [];
    recordAttempt(timestamps, 0);
    recordAttempt(timestamps, 1);
    recordAttempt(timestamps, 2);
    expect(isRateLimited(timestamps, 2999)).toBe(true);
    expect(isRateLimited(timestamps, 3000)).toBe(false);
  });

  it("does not lock a customer out if the clock goes backwards", () => {
    const timestamps: number[] = [];
    recordAttempt(timestamps, 3_600_000);
    recordAttempt(timestamps, 3_600_001);
    recordAttempt(timestamps, 3_600_002);
    // Clock jumps back an hour: those attempts are now "in the future".
    expect(isRateLimited(timestamps, 5_000)).toBe(false);
  });
});
