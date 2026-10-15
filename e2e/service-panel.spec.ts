import { expect, test } from "@playwright/test";
import { resetMachine } from "./helpers";

test.beforeEach(async ({ request }) => {
  await resetMachine(request);
});

test("service panel shows hopper and sealed cash box", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("service-panel-link").click();

  await expect(page).toHaveURL(/\/status$/);
  await expect(page.getByTestId("service-panel")).toContainText("Change hopper");
  await expect(page.getByTestId("cash-box")).toContainText("Sealed cash box");
  await expect(page.getByTestId("cash-box-total")).toHaveText("£0.00");
  await expect(page.getByTestId("hopper-100")).toContainText("×10");
});

test("reset machine restores hopper and empties cash box", async ({ page, request }) => {
  await page.goto("/");
  await page.getByTestId("product-cola").click();
  await page.getByTestId("customer-id").fill("tech");
  await page.getByTestId("pay-add-200").click();
  await page.getByTestId("vend-button").click();
  await expect(page.getByTestId("outcome-success")).toBeVisible();

  await page.goto("/status");
  await expect(page.getByTestId("cash-box-total")).not.toHaveText("£0.00");
  await expect(page.getByTestId("hopper-100")).not.toContainText("×10");

  await page.getByTestId("reset-machine").click();
  await expect(page.getByTestId("cash-box-total")).toHaveText("£0.00");
  await expect(page.getByTestId("hopper-100")).toContainText("×10");

  // Ensure server state matches UI (and rate limits were cleared).
  const machine = await request.get("/api/machine");
  const body = await machine.json();
  expect(body.cashBoxPence).toBe(0);
  expect(body.supply[100]).toBe(10);
});
