import { expect, test } from "@playwright/test";

const deployedUrl = process.env.ACTIONOS_DEPLOYED_URL;
const ownerState = process.env.ACTIONOS_OWNER_STORAGE_STATE;
const otherState = process.env.ACTIONOS_OTHER_STORAGE_STATE;
const caseId = process.env.ACTIONOS_CROSS_DEVICE_CASE_ID;

test.describe("real cross-device ownership", () => {
  test.skip(!deployedUrl || !ownerState || !caseId, "Provide a real Firebase owner state and owned case; this claim gate cannot use mocked identity");
  test("the linked Google owner recovers the case and another owner sees no facts", async ({ browser }) => {
    const owner = await browser.newContext({ storageState: ownerState });
    const ownerPage = await owner.newPage();
    await ownerPage.goto(`${deployedUrl}/cases/${caseId}/result`);
    await expect(ownerPage.getByRole("heading", { name: /Sign in to open/i })).toHaveCount(0);
    await expect(ownerPage.getByText(/What happens next/i)).toBeVisible();
    await owner.close();

    const other = await browser.newContext(otherState ? { storageState: otherState } : undefined);
    const otherPage = await other.newPage();
    await otherPage.goto(`${deployedUrl}/cases/${caseId}/result`);
    await expect(otherPage.getByRole("heading", { name: "Sign in to open this private case" })).toBeVisible();
    await expect(otherPage.getByText(/What happens next/i)).toHaveCount(0);
    await other.close();
  });
});
