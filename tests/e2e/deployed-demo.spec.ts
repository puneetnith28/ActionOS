import { expect, test } from "@playwright/test";

const deployedUrl = process.env.ACTIONOS_DEPLOYED_URL;

test.describe("deployed mobile judge path", () => {
  test.skip(!deployedUrl, "Set ACTIONOS_DEPLOYED_URL to run against the public Cloud Run service");

  test("captures, approves, leaves the page, and returns only on sufficient proof", async ({
    page
  }) => {
    test.setTimeout(120_000);
    const reference = `DEMO-${String(Date.now())}`;
    await page.goto(`${deployedUrl}/intake`);
    await expect(
      page.getByRole("heading", { name: "Say what needs to happen. ActionOS keeps it moving." })
    ).toBeVisible();
    await expect(page.getByTestId("intake-form")).toHaveAttribute("data-hydrated", "true", {
      timeout: 15_000
    });
    await page
      .getByRole("textbox", { name: "What happened, and what are you waiting for?" })
      .fill(
        `On August 1, 2026 Northstar Store confirmed it would refund USD 19.00 for order ${reference} by August 15, 2026. The refund is still missing.`
      );
    await page.getByRole("button", { name: "Build my plan" }).click();
    await expect(page).toHaveURL(/\/cases\/mission_[^/]+\/analyzing/, { timeout: 10_000 });
    await expect(page.getByText("Saved and running in the background")).toBeVisible();
    await page.getByRole("link", { name: "My follow-ups" }).click();
    await expect(page.getByRole("link", { name: /New promise/ })).toContainText(
      "Gemini is building the plan"
    );
    await page.getByRole("link", { name: /New promise/ }).click();
    await expect(page).toHaveURL(/\/cases\/mission_[^/]+\/review/, { timeout: 35_000 });
    await expect(page.getByText("Before you start")).toBeVisible();
    await expect(
      page.getByText(/It cannot spend, change the outcome, or call an acknowledgement done/)
    ).toBeVisible();
    await expect(page.getByText("How ActionOS contacts them")).toBeVisible();
    await expect(page.getByText("The first follow-up")).toBeVisible();
    await expect(page.getByText(`Follow-up for ${reference}`)).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Accelerated proof demo Selected" })
    ).toBeVisible();
    await expect(
      page.getByText(/proof demo is reproducible but contacts no company/)
    ).toBeVisible();
    await expect(page.getByText(/Accelerated controlled demo/)).toBeVisible();
    await expect(page.getByText("3 · How the result comes back to you")).toBeVisible();
    await expect(
      page
        .getByText(
          "Signed evidence from the responsible party confirming the exact outcome and reference."
        )
        .first()
    ).toBeVisible();
    await page.getByRole("checkbox", { name: /authorized to contact/ }).check();
    await page.getByRole("button", { name: "Approve and start follow-up" }).click();
    await expect(page).toHaveURL(/\/result/);
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "The reply did not prove the promised outcome" })
    ).toBeVisible({
      timeout: 70_000
    });
    await expect(
      page.getByText(
        "Another approved follow-up is scheduled because the reply only acknowledged the request"
      )
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Company confirmed the refund instruction" })
    ).toBeVisible({
      timeout: 75_000
    });
    await expect(page.getByText(/Bank settlement is not verified/i).first()).toBeVisible();
    await expect(page.getByText(/Durable case page/).first()).toBeVisible();
    await page.getByRole("button", { name: "Show technical trace" }).click();
    await expect(page.getByText(/CLOUD_TASK · SUCCEEDED|ACTION · SUCCEEDED/).first()).toBeVisible();
  });
});
