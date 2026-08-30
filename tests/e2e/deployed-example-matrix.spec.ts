import { expect, test } from "@playwright/test";

const deployedUrl = process.env.ACTIONOS_DEPLOYED_URL;

const visibleExamples = [
  { label: "Missing refund", expected: /USD 59|59\.00/ },
  { label: "Cancellation", expected: /USD 120|120\.00/ },
  { label: "Replacement", expected: /damaged headphones/i },
  { label: "Missing document", expected: /coverage certificate/i }
] as const;

test.describe("deployed visible example matrix", () => {
  test.skip(!deployedUrl, "Set ACTIONOS_DEPLOYED_URL to run against the public Cloud Run service");

  for (const example of visibleExamples) {
    test(`${example.label} completes the accelerated proof loop`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.goto(`${deployedUrl}/intake`);
      await expect(page.getByTestId("intake-form")).toHaveAttribute("data-hydrated", "true", {
        timeout: 15_000
      });
      await page.getByRole("button", { name: example.label }).click();
      await page.getByRole("button", { name: "Build my plan" }).click();
      await expect(page).toHaveURL(/\/cases\/mission_[^/]+\/review/, { timeout: 45_000 });
      await expect(page.getByText(example.expected).first()).toBeVisible();
      await expect(page.getByText("Accelerated after approval")).toBeVisible();
      await expect(page.getByText(/real Cloud Tasks.*run in seconds/i)).toBeVisible();
      await expect(page.getByText(/could not complete/i)).toHaveCount(0);
      await page.getByRole("checkbox", { name: /authorized to contact/ }).check();
      await page.getByRole("button", { name: "Approve and start follow-up" }).click();
      await expect(page).toHaveURL(/\/cases\/mission_[^/]+\/result/);
      await expect(page.getByRole("heading", {
        name: /Company confirmed the refund instruction|Company confirmed the promised outcome/
      })).toBeVisible({ timeout: 75_000 });
      await expect(page.getByText(/not verified/i).first()).toBeVisible();
    });
  }
});
