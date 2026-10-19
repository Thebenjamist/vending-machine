import { DENOMINATIONS } from "./coins";
import type { CoinCounts, CoinSupply } from "./types";

/**
 * Fewest coins to make `amount` pence from limited hopper stock.
 *
 * Bounded coin-change DP over denominations:
 *   minCoins[i][a] = fewest coins making `a` using only the first i denominations.
 *   For denomination i, try using k = 0..available of it.
 *
 * Each denomination keeps its own row (and `used[i][a]` = how many of it the
 * best answer takes), so the walk-back reads exactly one decision per
 * denomination and can never hand out more coins than the hopper holds.
 */
export function makeChange(supply: CoinSupply, amount: number): CoinCounts | null {
  if (amount === 0) {
    return {};
  }
  if (amount < 0 || !Number.isInteger(amount)) {
    return null;
  }

  const INF = Number.POSITIVE_INFINITY;
  const n = DENOMINATIONS.length;
  const minCoins: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(amount + 1).fill(INF),
  );
  const used: number[][] = Array.from({ length: n + 1 }, () =>
    new Array<number>(amount + 1).fill(0),
  );
  minCoins[0][0] = 0;

  for (let i = 1; i <= n; i += 1) {
    const denom = DENOMINATIONS[i - 1];
    const available = supply[denom] ?? 0;

    for (let a = 0; a <= amount; a += 1) {
      for (let k = 0; k <= available && k * denom <= a; k += 1) {
        const coins = minCoins[i - 1][a - k * denom] + k;
        if (coins < minCoins[i][a]) {
          minCoins[i][a] = coins;
          used[i][a] = k;
        }
      }
    }
  }

  if (minCoins[n][amount] === INF) {
    return null;
  }

  const counts: CoinCounts = {};
  let remaining = amount;
  for (let i = n; i >= 1; i -= 1) {
    const k = used[i][remaining];
    if (k > 0) {
      counts[DENOMINATIONS[i - 1]] = k;
    }
    remaining -= k * DENOMINATIONS[i - 1];
  }

  return counts;
}