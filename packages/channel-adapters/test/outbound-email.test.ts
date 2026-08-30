import { describe, expect, it, vi } from "vitest";
import { OutboundEmailAdapter, type EmailDeliveryReceipt } from "../src/outbound-email";

describe("outbound email", () => {
  it("delivers once and returns the stored receipt on replay", async () => {
    let receipt: EmailDeliveryReceipt | undefined;
    const send = vi.fn(() =>
      Promise.resolve({ deliveryId: "email_12345678", acceptedAt: "2026-08-16T00:00:00.000Z" })
    );
    const adapter = new OutboundEmailAdapter(
      {
        reserveDelivery: () => Promise.resolve(receipt ?? "RESERVED"),
        completeDelivery: (_key, value) => {
          receipt = value;
          return Promise.resolve();
        },
        failDelivery: () => Promise.resolve()
      },
      { send },
      "https://dueback.example/"
    );
    const notification = {
      notificationId: "notification_12345678",
      dedupeKey: `sha256:${"a".repeat(64)}`,
      caseId: "case_12345678",
      correlationId: "corr_12345678",
      ownerId: "person_12345678",
      kind: "CASE_COMPLETED" as const,
      deepLinkPath: "/cases/case_12345678/result",
      createdAt: "2026-08-16T00:00:00.000Z"
    };
    await expect(adapter.deliver(notification, "judge@example.test")).resolves.toMatchObject({
      duplicate: false
    });
    await expect(adapter.deliver(notification, "judge@example.test")).resolves.toMatchObject({
      duplicate: true
    });
    expect(send).toHaveBeenCalledOnce();
  });
});
