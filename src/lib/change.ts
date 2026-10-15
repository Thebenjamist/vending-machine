import { DENOMINATIONS } from "./coins";
import type { CoinCounts, CoinSupply, Denomination } from "./types";

type Choice = {
  from: number;
  denom: Denomination;
  count: number;
};

/**
 * Fewest coins to make `amount` pence from limited hopper stock.
 * Uses bounded coin-change DP (one group pass per denomination).
 */
export function makeChange(supply: CoinSupply, amount: number): CoinCounts | null {
  if (amount === 0) {
    return {};
  }
  if (amount < 0 || !Number.isInteger(amount)) {
    return null;
  }

  const INF = Number.POSITIVE_INFINITY;
  const minCoins = new Array<number>(amount + 1).fill(INF);
  const choice = new Array<Choice | null>(amount + 1).fill(null);
  minCoins[0] = 0;

  for (const denom of DENOMINATIONS) {
    const available = supply[denom] ?? 0;
    if (available <= 0) {
      continue;
    }

    const prev = minCoins.slice();

    for (let a = 0; a <= amount; a += 1) {
      if (prev[a] === INF) {
        continue;
      }

      for (let k = 1; k <= available; k += 1) {
        const nxt = a + k * denom;
        if (nxt > amount) {
          break;
        }

        const coins = prev[a] + k;
        if (coins < minCoins[nxt]) {
          minCoins[nxt] = coins;
          choice[nxt] = { from: a, denom, count: k };
        }
      }
    }
  }

  if (minCoins[amount] === INF) {
    return null;
  }

  const counts: CoinCounts = {};
  let cur = amount;
  while (cur > 0) {
    const step = choice[cur];
    if (!step) {
      return null;
    }
    counts[step.denom] = (counts[step.denom] ?? 0) + step.count;
    cur = step.from;
  }

  return counts;
}
