# Modo Vend

Next.js + TypeScript + MUI take-home: a UK coin vending machine. Customers select a product, pay in pence, and the API returns **fewest-coin change** from a depleting hopper. Refused purchases leave machine state untouched.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Front** — pick a product, enter customer ID, set payment, press **Buy**.
- **Service panel (back):** [http://localhost:3000/status](http://localhost:3000/status) — hopper stock, sealed cash box, demo **Reset machine**.

```bash
curl http://localhost:3000/api/machine
```

## Tests

```bash
npm test                 # Jest — change DP, rate limit, purchase flow, suggestions
npx playwright install   # once
npm run test:e2e         # Playwright (starts dev server; ENABLE_TEST_UTILS)
npm run lint
```

## API

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/purchase` | `{ customerId, pricePence, paidPence }` → success with change, or error |
| `GET` | `/api/machine` | Current hopper + cash box |
| `POST` | `/api/machine/reset` | Restore hopper (10 of each), empty cash box, clear rate limits. Optional `{ supply }` body for tests. |

## Purchase rules (server)

Checked in order:

1. **Input** — non-empty customer ID; price/payment non-negative integers; max **£1,000** (`100_000` pence).
2. **Rate limit** — max **3** purchase attempts per customer per **3 seconds** (checked first among business rules). Attempts that pass the rate check are recorded even if payment/change later fails; rate-limited requests are not recorded.
3. **Insufficient payment** — rejected; hopper unchanged.
4. **Change** — bounded min-coins DP over hopper stock (`1p…£2`, start with 10 of each). If change cannot be made, the response explains why and suggests payable amounts (exact price, then workable overpays).
5. **Success** — full payment goes to a **sealed cash box** (never into the hopper); change coins are removed from the hopper only.

## Assumptions

- Machine state is **in-memory** (lost on server restart). Shared via `globalThis` so App Router route handlers and pages see the same hopper in one process.
- All money is **integer pence**.
- UI validates before calling the API; the server remains the source of truth.
