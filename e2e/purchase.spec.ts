import { expect, test } from "@playwright/test";
import { completePurchase, resetMachine } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetMachine(request);
});

test("happy path returns change coins", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("product-water").click();
  await page.getByTestId("customer-id").fill("alice");
  await page.getByTestId("pay-add-200").click();
  await page.getByTestId("vend-button").click();

  await expect(page.getByTestId("outcome-success")).toContainText("Still Water");
  await expect(page.getByTestId("change-coins")).toBeVisible();
  await expect(page.getByTestId("change-coin-50")).toBeVisible();
  await expect(page.getByTestId("change-coin-20")).toBeVisible();
  await expect(page.getByTestId("change-coin-10")).toBeVisible();
});

test("exact payment shows no change messaging", async ({ page }) => {
  await page.goto("/");
  await completePurchase(page, {
    productTestId: "product-cola",
    customerId: "bob",
    payExact: true,
  });

  await expect(page.getByTestId("outcome-success")).toContainText("exact payment");
  await expect(page.getByTestId("change-coins")).toHaveCount(0);
});

test("insufficient funds is refused by the server and leaves the hopper untouched", async ({ page }) => {
  await page.goto("/");

  await page.getByTestId("product-juice").click();
  await page.getByTestId("customer-id").fill("cara");
  await page.getByTestId("pay-custom").fill("0.50");
  await page.getByTestId("vend-button").click();

  await expect(page.getByTestId("outcome-error-INSUFFICIENT_FUNDS")).toContainText("Payment too low");

  // Hopper must be untouched by the refused purchase.
  await page.goto("/status");
  await expect(page.getByTestId("service-panel")).toBeVisible();

  for (const denom of [1, 2, 5, 10, 20, 50, 100, 200]) {
    await expect(page.getByTestId(`hopper-${denom}`)).toContainText("×10");
  }
});

test("cannot make change with empty hopper", async ({ page, request }) => {
  await resetMachine(request, {
    supply: {
      1: 0,
      2: 0,
      5: 0,
      10: 0,
      20: 0,
      50: 0,
      100: 0,
      200: 0,
    },
  });

  await page.goto("/");
  await page.getByTestId("product-cola").click();
  await page.getByTestId("customer-id").fill("dana");
  await page.getByTestId("pay-add-200").click();
  await page.getByTestId("vend-button").click();

  const status = page.getByTestId("outcome-error-CANNOT_MAKE_CHANGE");
  await expect(status).toBeVisible();
  await expect(status).toContainText("£1.00 change");
  await expect(status).toContainText("exactly £1.00"); // empty hopper → exact only

  await page.goto("/status");
  for (const denom of [1, 2, 5, 10, 20, 50, 100, 200]) {
    await expect(page.getByTestId(`hopper-${denom}`)).toContainText("×0");
  }
});

test("rate limits a fourth purchase within three seconds", async ({ page }) => {
  await page.goto("/");

  for (let i = 0; i < 3; i += 1) {
    await completePurchase(page, {
      productTestId: "product-crisps",
      customerId: "erin",
      payExact: true,
    });
    await expect(page.getByTestId("outcome-success")).toBeVisible();
  }

  await completePurchase(page, {
    productTestId: "product-crisps",
    customerId: "erin",
    payExact: true,
  });

  await expect(page.getByTestId("outcome-error-RATE_LIMITED")).toBeVisible();
});

test("payment stays locked until a product is selected", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("payment-locked")).toBeVisible();
  await expect(page.getByTestId("vend-button")).toBeDisabled();

  await page.getByTestId("product-cola").click();
  await expect(page.getByTestId("payment-locked")).toHaveCount(0);
  await expect(page.getByTestId("vend-button")).toBeEnabled();

  await page.getByTestId("vend-button").click();
  await expect(page.getByTestId("customer-id-error")).toContainText("customer ID");
  await expect(page.getByTestId("vend-button")).toBeEnabled();
});
