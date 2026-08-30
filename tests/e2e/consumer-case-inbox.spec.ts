import { expect, test } from "@playwright/test";

const deployedUrl = process.env.ACTIONOS_DEPLOYED_URL;

test.describe("durable attention return", () => {
  test.skip(!deployedUrl, "Set ACTIONOS_DEPLOYED_URL");
  test("a closed-tab case returns in My follow-ups as Needs you", async ({ context }) => {
    await context.route("**/api/cases?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ items: [{ caseId: "mission_attention_12345678", companyName: "Northstar", outcomeLabel: "USD 59 refund", bucket: "NEEDS_YOU", statusLabel: "Decision needed", lastActivityAt: "2026-08-17T10:02:00.000Z", nextStepLabel: "Review one decision", attentionRequired: true, channelLabel: "Email" }], nextCursor: null }) }));
    const workingPage = await context.newPage();
    await workingPage.goto(`${deployedUrl}/`);
    await workingPage.close();
    const returnPage = await context.newPage();
    await returnPage.goto(`${deployedUrl}/cases`);
    await expect(returnPage.getByText("Needs you", { exact: true })).toBeVisible();
    await expect(returnPage.getByText("Review one decision", { exact: true })).toBeVisible();
  });
});
