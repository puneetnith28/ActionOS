import { expect, test } from "@playwright/test";

const deployedUrl = process.env.ACTIONOS_DEPLOYED_URL;

test.describe("deployed general commercial promise", () => {
  test.skip(!deployedUrl, "Set ACTIONOS_DEPLOYED_URL to run against the public Cloud Run service");

  test("follows through on a document promise without inventing money", async ({ page }) => {
    await page.goto(`${deployedUrl}/intake`);
    await expect(page.getByTestId("intake-form")).toHaveAttribute("data-hydrated", "true", {
      timeout: 15_000
    });
    await page
      .getByRole("textbox", {
        name: "What happened, and what are you waiting for?"
      })
      .fill(
        "Northstar Insurance promised to email the coverage certificate for mission MISSION-441 by August 16, 2026."
      );
    await page.getByRole("button", { name: "Build my plan" }).click();
    await expect(page).toHaveURL(/\/missions\/mission_[^/]+\/review/, { timeout: 45_000 });
    await expect(page.getByText("Not applicable", { exact: true })).toBeVisible();
    const sharedData = page
      .locator("summary")
      .filter({ hasText: "Exactly what data will be shared—and with whom" });
    const sharedDetails = sharedData.locator("..");
    if ((await sharedDetails.getAttribute("open")) === null) {
      await sharedData.click();
    }
    await expect(
      page.getByText(
        "the reference and promised outcome: only its demo merchant. No inbox access or extra fields.",
        { exact: true }
      )
    ).toBeVisible();

    await page.getByRole("checkbox", { name: /authorized to contact/ }).check();
    await page.getByRole("button", { name: "Approve and start follow-up" }).click();
    await expect(page).toHaveURL(/\/result/);
    await expect(
      page.getByRole("heading", {
        name: "Company confirmed the promised outcome"
      })
    ).toBeVisible({ timeout: 75_000 });
    await expect(page.getByText(/Independent fulfillment is not verified/i)).toBeVisible();
  });
});
