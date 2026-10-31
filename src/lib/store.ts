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
import {
  isRateLimited,
  pruneWindow,
  RATE_LIMIT_WINDOW_MS,
  recordAttempt,
} from "./rateLimit";
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
  lastSweepAt: number;
  completedByRequest: Map<string, CompletedRequest>;
};

type CompletedRequest = {
  pricePence: number;
  paidPence: number;
  result: PurchaseResult;
  at: number;
};

/** How long a request_id is remembered for replay. */
export const REQUEST_ID_TTL_MS = 10 * 60 * 1000;
const MAX_REQUEST_ID_LENGTH = 128;

function createInitialState(supply?: CoinSupply): StoreState {
  return {
    supply: supply ? cloneSupply(supply) : createFullSupply(),
    cashBoxPence: 0,
    attemptsByCustomer: new Map(),
    lastSweepAt: 0,
    completedByRequest: new Map(),
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

/**
 * Drop customers with no attempts left in the window, so the map can't grow forever.
 * Runs at most once per window, so the cost is amortised rather than per request.
 */
function pruneIdleCustomers(state: StoreState, now: number): void {
  if (Math.abs(now - state.lastSweepAt) < RATE_LIMIT_WINDOW_MS) {
    return;
  }
  state.lastSweepAt = now;
  for (const [id, timestamps] of state.attemptsByCustomer) {
    pruneWindow(timestamps, now);
    if (timestamps.length === 0) {
      state.attemptsByCustomer.delete(id);
    }
  }
  for (const [key, entry] of state.completedByRequest) {
    if (now - entry.at >= REQUEST_ID_TTL_MS) {
      state.completedByRequest.delete(key);
    }
  }
}

/** Customer IDs are case- and whitespace-insensitive ("Eve" === " eve "). */
function normaliseCustomerId(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function purchase(
  request: PurchaseRequest,
  now: number = Date.now(),
): PurchaseResult {
  const customerId = normaliseCustomerId(request.customerId);
  const { pricePence, paidPence } = request;
  const requestId = request.requestId;

  if (
    requestId !== undefined &&
    (typeof requestId !== "string" ||
      requestId.length === 0 ||
      requestId.length > MAX_REQUEST_ID_LENGTH)
  ) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      message: "Invalid request ID.",
    };
  }

  // Replay check runs before rate limiting so a retry is never throttled or re-counted.
  const requestKey =
    requestId !== undefined && customerId
      ? `${customerId}\u0000${requestId}`
      : null;
  if (requestKey) {
    const prior = getStore().completedByRequest.get(requestKey);
    if (prior && now - prior.at < REQUEST_ID_TTL_MS) {
      if (prior.pricePence !== pricePence || prior.paidPence !== paidPence) {
        return {
          ok: false,
          reason: "REQUEST_ID_CONFLICT",
          message: "This request ID was already used for a different purchase.",
        };
      }
      return prior.result;
    }
  }

  const result = processPurchase(customerId, pricePence, paidPence, now);

  const replayable =
    result.ok ||
    result.reason === "INSUFFICIENT_FUNDS" ||
    result.reason === "CANNOT_MAKE_CHANGE";
  if (requestKey && replayable) {
    getStore().completedByRequest.set(requestKey, {
      pricePence,
      paidPence,
      result,
      at: now,
    });
  }
  return result;
}

function processPurchase(
  customerId: string,
  pricePence: number,
  paidPence: number,
  now: number,
): PurchaseResult {
  // 1. Identity is the only thing we need before rate limiting.
  if (!customerId) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      message: "Enter a customer ID.",
    };
  }

  // 2. Rate limit before looking at price or payment (brief requirement).
  const state = getStore();
  const timestamps = state.attemptsByCustomer.get(customerId) ?? [];
  if (isRateLimited(timestamps, now)) {
    state.attemptsByCustomer.set(customerId, timestamps);
    return {
      ok: false,
      reason: "RATE_LIMITED",
      message: "Too many purchases — wait a moment and try again.",
    };
  }

  recordAttempt(timestamps, now);
  state.attemptsByCustomer.set(customerId, timestamps);
  pruneIdleCustomers(state, now);

  // 3. Now validate amounts. Invalid attempts still count towards the limit.
  const inputError = invalidInputMessage(customerId, pricePence, paidPence);
  if (inputError) {
    return {
      ok: false,
      reason: "INVALID_INPUT",
      message: inputError,
    };
  }

  if (paidPence < pricePence) {
    return {
      ok: false,
      reason: "INSUFFICIENT_FUNDS",
      message: `Payment too low — need more to cover the price.`,
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
    };
  }

  state.supply = subtractSupply(state.supply, change);
  state.cashBoxPence += paidPence;

  return {
    ok: true,
    change,
    changePence,
  };
}
