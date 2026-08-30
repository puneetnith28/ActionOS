import { expect, test } from "@playwright/test";

const deployedUrl = process.env.DUEBACK_DEPLOYED_URL;
const detail = {
  caseId: "case_consumer_12345678", version: 3, state: "WAITING_EXTERNAL", statusLabel: "Waiting for proof",
  nextAction: "Not done — the company only acknowledged the request", goal: "Receive the promised USD 59 refund",
  updatedAt: "2026-08-17T10:02:00.000Z", nextCheckAt: "2026-08-18T10:00:00.000Z", attemptCount: 1,
  channel: { type: "MANAGED_EMAIL", label: "Email", disclosure: "Controlled email pilot", contact: "DueBack sends the approved email", reply: "The company replies by email", recipientHint: "m•••@example.test" },
  returnPath: "Durable case page", outcome: { accepted: false, acknowledgementOnly: true, title: "Not done — request received only", explanation: "DueBack keeps this open until explicit evidence meets the approved contract.", limitation: "Bank settlement is not verified." },
  conversation: [{ id: "inbound-evidence", direction: "INBOUND", title: "The company acknowledged the request", occurredAt: "2026-08-17T10:01:00.000Z", safeBody: "Reference R-59", status: "NOT_RESOLVED", reason: "Acknowledgement is not proof that the promised outcome happened." }],
  comparison: [{ label: "Amount", promised: "5900", observed: "Not stated in the reply", status: "MISSING" }],
  notifications: [], interventions: [], timeline: [], technicalTraceEligible: false
};

test.describe("consumer case detail", () => {
  test.skip(!deployedUrl, "Set DUEBACK_DEPLOYED_URL");
  test("renders a legacy-safe projection without technical or private fields", async ({ page }) => {
    await page.route("**/api/cases/case_consumer_12345678/detail", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detail) }));
    await page.goto(`${deployedUrl}/cases/case_consumer_12345678/result`);
    await expect(page.getByRole("heading", { name: detail.goal })).toBeVisible();
    await expect(page.getByText("Not done — request received only", { exact: true })).toBeVisible();
    await expect(page.getByText("Not stated in the reply", { exact: false })).toBeVisible();
    await expect(page.getByText(/plan hash|correlation id|owner id/i)).toHaveCount(0);
  });

  test("preserves the last known case when refresh fails", async ({ page }) => {
    let calls = 0;
    await page.route("**/api/cases/case_consumer_12345678/detail", async (route) => {
      calls += 1;
      if (calls === 1) await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(detail) });
      else await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "DETAIL_FAILED" }) });
    });
    await page.goto(`${deployedUrl}/cases/case_consumer_12345678/result`);
    await expect(page.getByRole("heading", { name: detail.goal })).toBeVisible();
    await expect(page.getByRole("alert").filter({ hasText: "last saved state remains" })).toBeVisible();
    await expect(page.getByRole("heading", { name: detail.goal })).toBeVisible();
  });
});
