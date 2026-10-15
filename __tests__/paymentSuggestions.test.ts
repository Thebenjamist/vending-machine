import {
  formatCannotMakeChangeMessage,
  suggestPayableAmounts,
} from "@/lib/paymentSuggestions";
import { createFullSupply } from "@/lib/coins";
import type { CoinSupply } from "@/lib/types";

describe("paymentSuggestions", () => {
  it("suggests only exact payment when the hopper is empty", () => {
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

    expect(suggestPayableAmounts(empty, 100, 200)).toEqual([100]);
    expect(formatCannotMakeChangeMessage(100, [100])).toBe(
      "Can't make £1.00 change with the coins on hand. Try paying exactly £1.00.",
    );
  });

  it("suggests exact plus nearest workable overpays", () => {
    const fiftiesOnly: CoinSupply = {
      ...createFullSupply(0),
      50: 10,
    };

    // Need 30p change from £1.30 — impossible with only 50p coins.
    const suggestions = suggestPayableAmounts(fiftiesOnly, 100, 130);
    expect(suggestions[0]).toBe(100);
    expect(suggestions).toContain(150);
    expect(suggestions).toContain(200);
    expect(suggestions).toHaveLength(3);

    expect(formatCannotMakeChangeMessage(30, suggestions)).toBe(
      "Can't make £0.30 change with the coins on hand. Try £1.00 exact, or £1.50 / £2.00.",
    );
  });
});
