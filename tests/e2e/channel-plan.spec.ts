import { expect, test } from "@playwright/test";
import { makeDraftCase } from "../helpers/draft-case";
import type { DraftCase } from "../../packages/runtime/src/intake-service";

const deployedUrl = process.env.DUEBACK_DEPLOYED_URL;

test.describe("channel plan authorization", () => {
  test.skip(!deployedUrl, "Set DUEBACK_DEPLOYED_URL to run against the public Cloud Run service");

  test("shows the exact contract, versions a return-address change, and approves an available channel", async ({
    page
  }) => {
    const initial = makeDraftCase();
    let draft: DraftCase = {
      ...initial,
      plan: {
        ...initial.plan,
        channelType: "CONTROLLED_SANDBOX" as const,
        senderIdentity: "DueBack controlled demo",
        replyRoute: "Signed callback",
        messageTemplateVersion: "follow-up/v1",
        messageSubject: "Follow-up for ORDER-79",
        messageBody: "Please confirm the promised outcome for ORDER-79.",
        followUpIntervalSeconds: 172800,
        maxLogicalSends: 3
      }
    };
    await page.route("**/api/channels", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            channelType: "CONTROLLED_SANDBOX",
            status: "AVAILABLE",
            canSend: true,
            canReceive: true,
            supportsThreading: false,
            supportsDeliveryReceipt: true,
            supportsAuthenticatedReply: true,
            requiresUserOAuth: false,
            reasonCodes: ["CONTROLLED_DEMO_CONFIGURED"],
            checkedAt: "2026-08-16T12:00:00.000Z"
          }
        ])
      })
    );
    await page.route("**/api/cases/case_12345678/plan", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(draft)
        });
        return;
      }
      const command = route.request().postDataJSON() as {
        action: string;
        revision?: { notificationRecipient?: string };
      };
      if (command.action === "revise") {
        draft = {
          ...draft,
          plan: {
            ...draft.plan,
            version: 2,
            planHash: `sha256:${"b".repeat(64)}`,
            notificationRecipient: command.revision?.notificationRecipient
          }
        };
      } else if (command.action === "approve") {
        draft = { ...draft, state: "READY" as const };
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(draft)
      });
    });

    await page.goto(`${deployedUrl}/cases/case_12345678/review`);
    await expect(page.getByText("Follow-up for ORDER-79")).toBeVisible();
    await expect(page.getByText("3 sends", { exact: true })).toBeVisible();
    await expect(page.getByText("Every 2 days")).toBeVisible();
    await page
      .getByRole("textbox", { name: "Email for DueBack case updates" })
      .fill("owner@example.test");
    await page.getByRole("button", { name: "Save update email" }).click();
    await expect(page.getByText(/Plan updated to version 2/)).toBeVisible();
    await page.getByRole("checkbox", { name: /authorized to contact/ }).check();
    await page.getByRole("button", { name: "Approve and start follow-up" }).click();
    await expect(page).toHaveURL(/\/cases\/case_12345678\/result$/);
  });

  test("keeps approval blocked when the active channel is unavailable", async ({ page }) => {
    const draft = {
      ...makeDraftCase(),
      plan: {
        ...makeDraftCase().plan,
        channelType: "MANAGED_EMAIL" as const,
        senderIdentity: "DueBack <followup@example.test>",
        replyRoute: "case+opaque@inbound.example.test",
        messageSubject: "Follow-up for ORDER-79",
        messageBody: "Please confirm ORDER-79."
      }
    };
    await page.route("**/api/channels", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            channelType: "MANAGED_EMAIL",
            status: "UNAVAILABLE",
            canSend: false,
            canReceive: false,
            supportsThreading: false,
            supportsDeliveryReceipt: false,
            supportsAuthenticatedReply: false,
            requiresUserOAuth: false,
            reasonCodes: ["EMAIL_GATE_INCOMPLETE"],
            checkedAt: "2026-08-16T12:00:00.000Z"
          }
        ])
      })
    );
    await page.route("**/api/cases/case_12345678/plan", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(draft)
      })
    );
    await page.goto(`${deployedUrl}/cases/case_12345678/review`);
    await page.getByRole("checkbox", { name: /authorized to contact/ }).check();
    await expect(page.getByRole("button", { name: "Approve and start follow-up" })).toBeDisabled();
    await expect(page.getByText(/cannot be activated until/)).toBeVisible();
  });

  test("lets a person edit Gemini's certain fields and creates a new contract version", async ({
    page
  }) => {
    let draft = makeDraftCase();
    await page.route("**/api/channels", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            channelType: "CONTROLLED_SANDBOX",
            status: "AVAILABLE",
            canSend: true,
            canReceive: true,
            supportsThreading: false,
            supportsDeliveryReceipt: true,
            supportsAuthenticatedReply: true,
            requiresUserOAuth: false,
            reasonCodes: [],
            checkedAt: "2026-08-17T12:00:00.000Z"
          }
        ])
      })
    );
    await page.route("**/api/cases/case_12345678/plan", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(draft)
        });
        return;
      }
      const command = route.request().postDataJSON() as {
        action: string;
        revision: { promisor: string; result: string; transactionRef: string };
      };
      expect(command).toMatchObject({
        action: "revise",
        revision: {
          promisor: "Northstar Argentina",
          result: "USD 59 refund",
          transactionRef: "CASE-AR-42"
        }
      });
      draft = {
        ...draft,
        promiseDraft: {
          ...draft.promiseDraft,
          promisor: { ...draft.promiseDraft.promisor, value: command.revision.promisor },
          result: { ...draft.promiseDraft.result, value: command.revision.result },
          transactionRef: {
            ...draft.promiseDraft.transactionRef,
            value: command.revision.transactionRef
          }
        },
        plan: { ...draft.plan, version: 2, planHash: `sha256:${"d".repeat(64)}` }
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(draft)
      });
    });

    await page.goto(`${deployedUrl}/cases/case_12345678/review`);
    await page.getByText("Edit what Gemini understood").click();
    await page.getByRole("textbox", { name: "Company name" }).fill("Northstar Argentina");
    await page.getByRole("textbox", { name: "Promised result" }).fill("USD 59 refund");
    await page.getByRole("textbox", { name: "Order or case reference" }).fill("CASE-AR-42");
    await page.getByRole("button", { name: "Save corrected contract" }).click();
    await expect(page.getByText(/Plan updated to version 2/)).toBeVisible();
    await expect(page.getByText("Northstar Argentina", { exact: true })).toBeVisible();
  });

  test("switches between available channels with a keyboard-operable authorization control", async ({
    page
  }) => {
    const initial = makeDraftCase();
    let draft: DraftCase = {
      ...initial,
      plan: {
        ...initial.plan,
        channelType: "CONTROLLED_SANDBOX" as const,
        senderIdentity: "DueBack controlled demo",
        replyRoute: "Signed callback"
      }
    };
    await page.route("**/api/channels", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            channelType: "CONTROLLED_SANDBOX",
            status: "AVAILABLE",
            canSend: true,
            canReceive: true,
            supportsThreading: false,
            supportsDeliveryReceipt: true,
            supportsAuthenticatedReply: true,
            requiresUserOAuth: false,
            reasonCodes: [],
            checkedAt: "2026-08-16T12:00:00.000Z"
          },
          {
            channelType: "MANAGED_EMAIL",
            status: "AVAILABLE",
            canSend: true,
            canReceive: true,
            supportsThreading: true,
            supportsDeliveryReceipt: true,
            supportsAuthenticatedReply: true,
            requiresUserOAuth: false,
            reasonCodes: [],
            checkedAt: "2026-08-16T12:00:00.000Z"
          }
        ])
      })
    );
    await page.route("**/api/cases/case_12345678/plan", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(draft)
        });
        return;
      }
      const command = route.request().postDataJSON() as { action: string };
      expect(command.action).toBe("select-channel");
      draft = {
        ...draft,
        plan: {
          ...draft.plan,
          version: 2,
          planHash: `sha256:${"c".repeat(64)}`,
          channelType: "MANAGED_EMAIL",
          allowedRecipient: "support@northstar.example",
          senderIdentity: "DueBack <followup@dueback.example>",
          replyRoute: "case+opaque@reply.dueback.example"
        }
      };
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(draft)
      });
    });
    await page.goto(`${deployedUrl}/cases/case_12345678/review`);
    const email = page.getByRole("button", { name: /Controlled email pilot/ });
    await email.focus();
    await page.keyboard.press("Enter");
    await expect(email).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText(/Contact channel changed.*version 2/)).toBeVisible();
    await expect(page.getByText("case+opaque@reply.dueback.example")).toBeVisible();
  });
});
