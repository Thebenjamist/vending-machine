import { makeChange } from "@/lib/change";
import { createFullSupply } from "@/lib/coins";
import type { CoinSupply } from "@/lib/types";

function supplyWith(overrides: Partial<CoinSupply>): CoinSupply {
  return { ...createFullSupply(), ...overrides };
}

describe("makeChange", () => {
  it("returns empty counts for exact zero change", () => {
    expect(makeChange(createFullSupply(), 0)).toEqual({});
  });

  it("returns null for negative amounts", () => {
    expect(makeChange(createFullSupply(), -1)).toBeNull();
  });

  it("makes 80p with fewest coins from a full hopper", () => {
    expect(makeChange(createFullSupply(), 80)).toEqual({
      50: 1,
      20: 1,
      10: 1,
    });
  });

  it("uses alternate coins when a denomination is exhausted", () => {
    const supply = supplyWith({ 50: 0, 20: 0, 10: 8 });
    expect(makeChange(supply, 80)).toEqual({ 10: 8 });
  });

  it("returns null when change is impossible with current stock", () => {
    const supply = supplyWith({
      1: 0,
      2: 0,
      5: 0,
      10: 0,
      20: 0,
      50: 0,
      100: 0,
      200: 0,
    });
    expect(makeChange(supply, 30)).toBeNull();
  });

  it("finds a feasible non-greedy path under limited stock", () => {
    // Greedy would take 50 then need 10 with no 10s left.
    // DP should use three 20p coins instead.
    const supply = supplyWith({
      50: 1,
      20: 3,
      10: 0,
      5: 0,
      2: 0,
      1: 0,
      100: 0,
      200: 0,
    });
    expect(makeChange(supply, 60)).toEqual({ 20: 3 });
  });
});
