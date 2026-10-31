export const DENOMINATIONS = [1, 2, 5, 10, 20, 50, 100, 200] as const;

export type Denomination = (typeof DENOMINATIONS)[number];

export type CoinSupply = Record<Denomination, number>;

export type CoinCounts = Partial<Record<Denomination, number>>;

export type PurchaseReason =
  | "RATE_LIMITED"
  | "INSUFFICIENT_FUNDS"
  | "CANNOT_MAKE_CHANGE"
  | "INVALID_INPUT"
  | "REQUEST_ID_CONFLICT";

export type PurchaseRequest = {
  customerId: string;
  pricePence: number;
  paidPence: number;
  /** Caller-supplied idempotency key; repeats return the original result. */
  requestId?: string;
};

export type PurchaseSuccess = {
  ok: true;
  change: CoinCounts;
  changePence: number;
};

export type PurchaseFailure = {
  ok: false;
  reason: PurchaseReason;
  message: string;
  /** Present when change was required but could not be made. */
  changePence?: number;
  /** Payable amounts that would work with current hopper (exact first). */
  suggestedPayments?: number[];
};

export type PurchaseResult = PurchaseSuccess | PurchaseFailure;

export type MachineState = {
  supply: CoinSupply;
  cashBoxPence: number;
};
