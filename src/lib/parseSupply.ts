import { DENOMINATIONS } from "./coins";
import type { CoinSupply, Denomination } from "./types";

export function parseSupply(raw: unknown): CoinSupply | undefined {
  if (!raw || typeof raw !== "object") {
    return undefined;
  }

  const supply = {} as CoinSupply;
  for (const denom of DENOMINATIONS) {
    const value = (raw as Record<string, unknown>)[String(denom)];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
      return undefined;
    }
    supply[denom as Denomination] = value;
  }
  return supply;
}
