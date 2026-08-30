import { expect, test } from "@playwright/test";

const deployedUrl = process.env.ACTIONOS_DEPLOYED_URL;
const detail = {
  caseId: "mission_a11y_12345678",
  version: 1,
  state: "NEEDS_ATTENTION",
  statusLabel: "Decision needed",
  nextAction: "Review one decision before ActionOS continues",
  goal: "Receive an accessible refund update",
  updatedAt: "2026-08-17T10:02:00.000Z",
  attemptCount: 1,
  channel: {
    type: "CONTROLLED_SANDBOX",
    label: "Controlled demo",
    disclosure: "Controlled demo",
    contact: "ActionOS contacts the controlled merchant",
    reply: "A signed demo response returns",
    recipientHint: "Controlled endpoint"
  },
  returnPath: "Durable case page",
  outcome: {
    accepted: false,
    acknowledgementOnly: false,
    title: "Waiting for sufficient proof",
    explanation: "The case stays open.",
    limitation: "Bank settlement is not verified."
  },
  conversation: [],
  comparison: [
    {
      label: "Proof level",
      promised: "MERCHANT_CONFIRMED",
      observed: "Not stated in the reply",
      status: "MISSING"
    }
  ],
  notifications: [],
  interventions: [],
  timeline: [],
  technicalTraceEligible: false
};

test.describe("case accessibility", () => {
  test.skip(!deployedUrl, "Set ACTIONOS_DEPLOYED_URL");
  test.use({ reducedMotion: "reduce" });
  test("supports keyboard landmarks, live state and 200 percent reflow", async ({ page }) => {
    await page.route("**/api/cases/mission_a11y_12345678/detail", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detail) })
    );
    await page.goto(`${deployedUrl}/cases/mission_a11y_12345678/result`);
    await expect(page.getByRole("status")).toContainText("Review one decision", {
      timeout: 15_000
    });
    await page.getByText("Technical activity").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByText(/Consumer-safe lifecycle events/)).toBeVisible();
    // A 320 CSS-pixel viewport is the browser-equivalent reflow target for
    // 200% zoom on a 640 CSS-pixel viewport.
    await page.setViewportSize({ width: 320, height: 900 });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
  });
});
