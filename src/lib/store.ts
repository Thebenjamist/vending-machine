import { makeChange } from "./change";
import {
  cloneSupply,
  createFullSupply,
  emptyCounts,
  formatPence,
  subtractSupply,
} from "./coins";
import {
  formatCannotMakeChangeMessage,
  suggestPayableAmounts,
} from "./paymentSuggestions";
import { isRateLimited, recordAttempt } from "./rateLimit";
import type {
  CoinSupply,
  MachineState,
  PurchaseRequest,
  PurchaseResult,
} from "./types";

type StoreState = {
  supply: CoinSupply;
  cashBoxPence: number;
  attemptsByCustomer: Map<string, number[]>;
};

function createInitialState(supply?: CoinSupply): StoreState {
  return {
    supply: supply ? cloneSupply(supply) : createFullSupply(),
    cashBoxPence: 0,
    attemptsByCustomer: new Map(),
  };
}

// Next.js can evaluate this module separately for Route Handlers vs RSC.
// Pin the live machine to globalThis so API + /status share one hopper.
const globalForStore = globalThis as typeof globalThis & {
  __modoVendStore?: StoreState;
};

function getStore(): StoreState {
  if (!globalForStore.__modoVendStore) {
    globalForStore.__modoVendStore = createInitialState();
  }
  return globalForStore.__modoVendStore;
}

export function getMachineState(): MachineState {
  const state = getStore();
  return {
    supply: cloneSupply(state.supply),
    cashBoxPence: state.cashBoxPence,
  };
}

export function resetStore(options?: {
  supply?: CoinSupply;
  cashBoxPence?: number;
}): MachineState {
  const next = createInitialState(options?.supply);
  if (typeof options?.cashBoxPence === "number") {
    next.cashBoxPence = options.cashBoxPence;
  }
  globalForStore.__modoVendStore = next;
  return getMachineState();
}

/** Hard cap to keep change DP bounded (pence). */
const MAX_AMOUNT_PENCE = 100_000;

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function invalidInputMessage(
  customerId: string,
  pricePence: unknown,
  paidPence: unknown,
): string | null {
  if (!customerId) {
    return "Enter a customer ID.";
  }
  if (!isNonNegativeInteger(pricePence) || !isNonNegativeInteger(paidPence)) {
    return "Price and payment must be whole-pence amounts.";
  }
  if (pricePence > MAX_AMOUNT_PENCE || paidPence > MAX_AMOUNT_PENCE) {
    return `Amount too large — maximum is ${formatPence(MAX_AMOUNT_PENCE)}.`;
  }
  return null;
}

export function purchase(
  request: PurchaseRequest,
  now: number = Date.now(),
): PurchaseResult {
  const customerId = request.customerId?.trim() ?? "";
  const { pricePence, paidPence } = request;

  const inputError = invalidInputMessage(customerId, pricePence, paidPence);
  if (inputError) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      message: inputError,
      ...getMachineState(),
    };
  }

  const state = getStore();
  let timestamps = state.attemptsByCustomer.get(customerId);
  if (!timestamps) {
    timestamps = [];
    state.attemptsByCustomer.set(customerId, timestamps);
  }

  if (isRateLimited(timestamps, now)) {
    return {
      ok: false,
      reason: "RATE_LIMITED",
      message: "Too many purchases — wait a moment and try again.",
      ...getMachineState(),
    };
  }

  // Count this attempt before business-rule checks so spam still burns the window.
  recordAttempt(timestamps, now);

  if (paidPence < pricePence) {
    return {
      ok: false,
      reason: "INSUFFICIENT_FUNDS",
      message: `Payment too low — need more to cover the price.`,
      ...getMachineState(),
    };
  }

  const changePence = paidPence - pricePence;
  const change =
    changePence === 0 ? emptyCounts() : makeChange(state.supply, changePence);

  if (change === null) {
    const suggestedPayments = suggestPayableAmounts(
      state.supply,
      pricePence,
      paidPence,
    );
    return {
      ok: false,
      reason: "CANNOT_MAKE_CHANGE",
      message: formatCannotMakeChangeMessage(changePence, suggestedPayments),
      changePence,
      suggestedPayments,
      ...getMachineState(),
    };
  }

  state.supply = subtractSupply(state.supply, change);
  state.cashBoxPence += paidPence;

  return {
    ok: true,
    change,
    changePence,
    ...getMachineState(),
  };
}
