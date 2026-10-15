import { makeChange } from "./change";
import { formatPence } from "./coins";
import type { CoinSupply } from "./types";

const SEARCH_RANGE_PENCE = 500;
const MAX_ALTERNATIVES = 2;

/**
 * Suggest payable amounts when the customer's payment couldn't be changed.
 * Always includes exact price (no change). Then finds the next workable overpays.
 */
export function suggestPayableAmounts(
  supply: CoinSupply,
  pricePence: number,
  failedPaidPence: number,
): number[] {
  const suggestions: number[] = [pricePence];
  const maxPaid = pricePence + SEARCH_RANGE_PENCE;

  for (
    let paid = pricePence + 1;
    paid <= maxPaid && suggestions.length < 1 + MAX_ALTERNATIVES;
    paid += 1
  ) {
    if (paid === failedPaidPence) {
      continue;
    }
    if (makeChange(supply, paid - pricePence) !== null) {
      suggestions.push(paid);
    }
  }

  return suggestions;
}

export function formatCannotMakeChangeMessage(
  changePence: number,
  suggestions: number[],
): string {
  const changeBit = `Can't make ${formatPence(changePence)} change with the coins on hand.`;

  if (suggestions.length === 0) {
    return `${changeBit} Try a different amount.`;
  }

  const [exact, ...alternatives] = suggestions;
  if (alternatives.length === 0) {
    return `${changeBit} Try paying exactly ${formatPence(exact)}.`;
  }

  const altText = alternatives.map((p) => formatPence(p)).join(" / ");
  return `${changeBit} Try ${formatPence(exact)} exact, or ${altText}.`;
}
