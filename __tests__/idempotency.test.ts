import { getMachineState, purchase, REQUEST_ID_TTL_MS, resetStore } from "@/lib/store";

const base = { customerId: "alice", pricePence: 120, paidPence: 200 };

describe("purchase idempotency", () => {
  beforeEach(() => {
    resetStore();
  });

  it("replays the original result without booking twice", () => {
    const first = purchase({ ...base, requestId: "r1" }, 1000);
    const afterFirst = getMachineState();
    const second = purchase({ ...base, requestId: "r1" }, 2000);

    expect(second).toEqual(first);
    expect(getMachineState()).toEqual(afterFirst);
    expect(afterFirst.cashBoxPence).toBe(200);
  });

  it("replays the purchase receipt while live machine state remains current", () => {
    const first = purchase({ ...base, requestId: "r1" }, 1000);
    purchase(
      { customerId: "bob", pricePence: 180, paidPence: 200, requestId: "r2" },
      1001,
    );

    const replay = purchase({ ...base, requestId: "r1" }, 1002);

    expect(replay).toEqual(first);
    expect(replay).not.toHaveProperty("supply");
    expect(replay).not.toHaveProperty("cashBoxPence");
    expect(getMachineState()).toMatchObject({
      cashBoxPence: 400,
      supply: { 10: 9, 20: 8, 50: 9 },
    });
  });

  it("rejects the same request_id with a different payload", () => {
    purchase({ ...base, requestId: "r1" }, 1000);
    const before = getMachineState();

    const result = purchase({ ...base, paidPence: 500, requestId: "r1" }, 2000);

    expect(result).toMatchObject({ ok: false, reason: "REQUEST_ID_CONFLICT" });
    expect(getMachineState()).toEqual(before);
  });

  it("scopes request_ids per customer", () => {
    purchase({ ...base, requestId: "r1" }, 1000);
    const other = purchase({ ...base, customerId: "bob", requestId: "r1" }, 1001);

    expect(other.ok).toBe(true);
    expect(getMachineState().cashBoxPence).toBe(400);
  });

  it("does not rate limit or count a replay", () => {
    purchase({ ...base, requestId: "r1" }, 1000);
    purchase({ ...base, requestId: "r2" }, 1001);
    purchase({ ...base, requestId: "r3" }, 1002);

    const replay = purchase({ ...base, requestId: "r1" }, 1003);
    expect(replay.ok).toBe(true);

    const fresh = purchase({ ...base, requestId: "r4" }, 1004);
    expect(fresh).toMatchObject({ ok: false, reason: "RATE_LIMITED" });
  });

  it("does not cache rate-limited results", () => {
    purchase({ ...base }, 1000);
    purchase({ ...base }, 1001);
    purchase({ ...base }, 1002);
    expect(purchase({ ...base, requestId: "r1" }, 1003)).toMatchObject({
      reason: "RATE_LIMITED",
    });

    const later = purchase({ ...base, requestId: "r1" }, 1003 + 60_000);
    expect(later.ok).toBe(true);
  });

  it("replays definitive failures", () => {
    const first = purchase({ ...base, paidPence: 50, requestId: "r1" }, 1000);
    const second = purchase({ ...base, paidPence: 50, requestId: "r1" }, 1001);

    expect(first).toMatchObject({ ok: false, reason: "INSUFFICIENT_FUNDS" });
    expect(second).toEqual(first);
  });

  it("does not dedupe requests without a request_id", () => {
    purchase({ ...base }, 1000);
    purchase({ ...base }, 1001);

    expect(getMachineState().cashBoxPence).toBe(400);
  });

  it("forgets request_ids after the TTL", () => {
    purchase({ ...base, requestId: "r1" }, 1000);
    purchase({ ...base, requestId: "r1" }, 1000 + REQUEST_ID_TTL_MS + 1);

    expect(getMachineState().cashBoxPence).toBe(400);
  });

  it("clears remembered request_ids on reset", () => {
    purchase({ ...base, requestId: "r1" }, 1000);
    resetStore();
    purchase({ ...base, requestId: "r1" }, 1001);

    expect(getMachineState().cashBoxPence).toBe(200);
  });

  it("rejects an empty or oversized request_id", () => {
    expect(purchase({ ...base, requestId: "" })).toMatchObject({
      reason: "INVALID_INPUT",
    });
    expect(purchase({ ...base, requestId: "x".repeat(129) })).toMatchObject({
      reason: "INVALID_INPUT",
    });
  });
});
