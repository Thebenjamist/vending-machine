import { createFullSupply } from "@/lib/coins";
import { purchase, resetStore, getMachineState } from "@/lib/store";
import type { CoinSupply } from "@/lib/types";

describe("purchase flow", () => {
  beforeEach(() => {
    resetStore();
  });

  it("accepts exact payment without changing the hopper", () => {
    const before = getMachineState();
    const result = purchase({
      customerId: "alice",
      pricePence: 120,
      paidPence: 120,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.change).toEqual({});
    expect(result.changePence).toBe(0);
    expect(result.supply).toEqual(before.supply);
    expect(result.cashBoxPence).toBe(120);
  });

  it("dispenses fewest-coin change and decrements the hopper", () => {
    const result = purchase({
      customerId: "alice",
      pricePence: 120,
      paidPence: 200,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.changePence).toBe(80);
    expect(result.change).toEqual({ 50: 1, 20: 1, 10: 1 });
    expect(result.supply[50]).toBe(9);
    expect(result.supply[20]).toBe(9);
    expect(result.supply[10]).toBe(9);
    expect(result.cashBoxPence).toBe(200);
  });

  it("rejects insufficient funds without mutating state", () => {
    const before = getMachineState();
    const result = purchase({
      customerId: "alice",
      pricePence: 150,
      paidPence: 100,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "INSUFFICIENT_FUNDS",
    });
    expect(getMachineState()).toEqual(before);
  });

  it("rejects when change cannot be made and leaves hopper unchanged", () => {
    const empty: CoinSupply = {
      1: 0,
      2: 0,
      5: 0,
      10: 0,
      20: 0,
      50: 0,
      100: 0,
      200: 0,
    };
    resetStore({ supply: empty });
    const before = getMachineState();

    const result = purchase({
      customerId: "alice",
      pricePence: 100,
      paidPence: 200,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "CANNOT_MAKE_CHANGE",
      changePence: 100,
      suggestedPayments: [100],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("£1.00 change");
      expect(result.message).toContain("exactly £1.00");
    }
    expect(getMachineState()).toEqual(before);
  });

  it("suggests workable overpays when some change is possible", () => {
    resetStore({
      supply: {
        1: 0,
        2: 0,
        5: 0,
        10: 0,
        20: 0,
        50: 10,
        100: 0,
        200: 0,
      },
    });

    const result = purchase({
      customerId: "alice",
      pricePence: 100,
      paidPence: 130,
    });

    expect(result).toMatchObject({
      ok: false,
      reason: "CANNOT_MAKE_CHANGE",
      suggestedPayments: [100, 150, 200],
    });
    if (!result.ok) {
      expect(result.message).toContain("£1.00 exact");
      expect(result.message).toContain("£1.50");
      expect(result.message).toContain("£2.00");
    }
  });

  it("rate limits before checking price or change", () => {
    const t0 = 10_000;
    purchase({ customerId: "alice", pricePence: 100, paidPence: 100 }, t0);
    purchase({ customerId: "alice", pricePence: 100, paidPence: 100 }, t0 + 1);
    purchase({ customerId: "alice", pricePence: 100, paidPence: 100 }, t0 + 2);

    const limited = purchase(
      { customerId: "alice", pricePence: 1, paidPence: 0 },
      t0 + 3,
    );

    expect(limited).toMatchObject({
      ok: false,
      reason: "RATE_LIMITED",
    });
    // Cash box should reflect only the three successful exact payments.
    expect(getMachineState().cashBoxPence).toBe(300);
  });

  it("keeps rate limits independent per customer", () => {
    const t0 = 20_000;
    purchase({ customerId: "alice", pricePence: 100, paidPence: 100 }, t0);
    purchase({ customerId: "alice", pricePence: 100, paidPence: 100 }, t0 + 1);
    purchase({ customerId: "alice", pricePence: 100, paidPence: 100 }, t0 + 2);

    const bob = purchase(
      { customerId: "bob", pricePence: 65, paidPence: 65 },
      t0 + 3,
    );

    expect(bob.ok).toBe(true);
  });

  it("rejects invalid input", () => {
    const result = purchase({
      customerId: "  ",
      pricePence: 100,
      paidPence: 100,
    });
    expect(result).toMatchObject({ ok: false, reason: "INVALID_INPUT" });
    expect(getMachineState().supply).toEqual(createFullSupply());
  });
});
