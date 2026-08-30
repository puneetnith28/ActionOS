import { expect, test } from "@playwright/test";

const deployedUrl = process.env.DUEBACK_DEPLOYED_URL;

test.describe("deployed ambiguous promise review", () => {
  test.skip(!deployedUrl, "Set DUEBACK_DEPLOYED_URL to run against the public Cloud Run service");

  test("shows uncertainty and makes every blocker recoverable without developer tools", async ({
    page
  }) => {
    test.setTimeout(120_000);
    await page.goto(`${deployedUrl}/privacy`);
    await expect(
      page.getByRole("heading", { name: "Only the promise you choose to share." })
    ).toBeVisible();

    await page.goto(`${deployedUrl}/intake`);
    await expect(page.getByTestId("intake-form")).toHaveAttribute("data-hydrated", "true", {
      timeout: 15_000
    });
    await page
      .getByRole("textbox", { name: "What happened, and what are you waiting for?" })
      .fill(
        "Northstar Store will refund USD 79 for ORDER-79. A later paragraph says the approved amount is USD 59. Case REF-1001."
      );
    await page.getByRole("button", { name: "Build my plan" }).click();
    await expect(page).toHaveURL(/\/cases\/mission_[^/]+\/review/, { timeout: 45_000 });
    await expect(
      page.getByText(/Conflicting information|Needs confirmation/).first()
    ).toBeVisible();

    await page.getByRole("textbox", { name: "Company name" }).fill("Northstar Store");
    await page.getByRole("textbox", { name: "Promised result" }).fill("refund");
    await page.getByRole("textbox", { name: "Amount" }).fill("59.00");
    await page.getByRole("textbox", { name: "Currency" }).fill("USD");
    await page.getByRole("textbox", { name: "Order or case reference" }).fill("ORDER-79");
    await page.getByRole("textbox", { name: "Follow-up date" }).fill("2026-08-15T12:00");
    await page.getByRole("button", { name: "Save corrected contract" }).click();
    await expect(page.getByText(/Plan updated to version 2/)).toBeVisible({ timeout: 15_000 });

    const activate = page.getByRole("button", { name: "Approve and start follow-up" });
    await page.getByRole("checkbox", { name: /authorized to contact/ }).check();
    await expect(activate).toBeEnabled();
    await activate.click();
    await expect(page).toHaveURL(/\/result/);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "Company confirmed the refund instruction" })
    ).toBeVisible({
      timeout: 75_000
    });
  });
});
