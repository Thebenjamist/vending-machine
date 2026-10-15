import type { APIRequestContext, Page } from "@playwright/test";
import type { CoinSupply } from "../src/lib/types";

export async function resetMachine(
  request: APIRequestContext,
  options?: { supply?: CoinSupply; cashBoxPence?: number },
) {
  const response = await request.post("/api/machine/reset", {
    data: options ?? {},
  });
  if (!response.ok()) {
    throw new Error(`reset failed: ${response.status()} ${await response.text()}`);
  }
}

export async function completePurchase(
  page: Page,
  options: {
    productTestId: string;
    customerId: string;
    payExact?: boolean;
    customPounds?: string;
  },
) {
  await page.getByTestId(options.productTestId).click();
  await page.getByTestId("customer-id").fill(options.customerId);

  if (options.payExact) {
    await page.getByTestId("pay-exact").click();
  } else if (options.customPounds !== undefined) {
    await page.getByTestId("pay-custom").fill(options.customPounds);
  }

  await page.getByTestId("vend-button").click();
}
