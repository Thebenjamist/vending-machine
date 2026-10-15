import { DENOMINATIONS, type CoinCounts, type CoinSupply, type Denomination } from "./types";

export { DENOMINATIONS };

export const INITIAL_COINS_PER_DENOM = 10;

export function createFullSupply(
  count: number = INITIAL_COINS_PER_DENOM,
): CoinSupply {
  return DENOMINATIONS.reduce((acc, denom) => {
    acc[denom] = count;
    return acc;
  }, {} as CoinSupply);
}

export function cloneSupply(supply: CoinSupply): CoinSupply {
  return { ...supply };
}

export function emptyCounts(): CoinCounts {
  return {};
}

export function totalCoins(counts: CoinCounts): number {
  return DENOMINATIONS.reduce((sum, denom) => sum + (counts[denom] ?? 0), 0);
}

export function formatDenomination(pence: Denomination): string {
  if (pence >= 100) {
    const pounds = pence / 100;
    return pounds === 1 ? "£1" : `£${pounds}`;
  }
  return `${pence}p`;
}

export function formatPence(pence: number): string {
  const sign = pence < 0 ? "-" : "";
  const abs = Math.abs(pence);
  const pounds = Math.floor(abs / 100);
  const remainder = abs % 100;
  return `${sign}£${pounds}.${remainder.toString().padStart(2, "0")}`;
}

export function subtractSupply(supply: CoinSupply, change: CoinCounts): CoinSupply {
  const next = cloneSupply(supply);
  for (const denom of DENOMINATIONS) {
    const used = change[denom] ?? 0;
    next[denom] -= used;
  }
  return next;
}

export function nonZeroChange(change: CoinCounts): Array<{ denom: Denomination; count: number }> {
  return DENOMINATIONS.filter((denom) => (change[denom] ?? 0) > 0).map((denom) => ({
    denom,
    count: change[denom] as number,
  }));
}
