import { describe, expect, it, vi } from "vitest";
import {
  NotificationDeliveryService,
  type NotificationRecord
} from "../../packages/runtime/src/notifications";
import {
  InterventionService,
  type InterventionRecord
} from "../../packages/runtime/src/interventions";

describe("attention notification replay", () => {
  it("creates one logical attention notification and one provider send under concurrent replay", async () => {
    const interventions = new Map<string, InterventionRecord>();
    const notifications = new Map<string, NotificationRecord>();
    const deliver = vi.fn(() => Promise.resolve({
      receipt: { deliveryId: "delivery_attention_1234", acceptedAt: "2026-08-17T19:00:01.000Z" },
      duplicate: false
    }));
    const notificationStore = {
      createIfAbsent: async (record: NotificationRecord) => {
        const existing = notifications.get(record.dedupeKey);
        if (existing) return { record: existing, duplicate: true };
        notifications.set(record.dedupeKey, record);
        return { record, duplicate: false };
      },
      updateDelivery: () => Promise.resolve()
    };
    const service = new InterventionService({
      createInterventionIfAbsent: async (record) => {
        const existing = interventions.get(record.dedupeKey);
        if (existing) return { record: existing, duplicate: true };
        interventions.set(record.dedupeKey, record);
        return { record, duplicate: false };
      },
      listInterventions: () => Promise.resolve([...interventions.values()])
    }, notificationStore, new NotificationDeliveryService(notificationStore, { deliver }));
    const input = {
      caseId: "mission_12345678", ownerId: "owner_12345678", correlationId: "corr_attention_12345678",
      kind: "EVIDENCE_CONFLICT" as const, reasonCodes: ["WRONG_AMOUNT"], requestedField: "amount",
      notificationRecipient: "owner@example.test", createdAt: "2026-08-17T19:00:00.000Z"
    };
    await Promise.all([service.raise(input), service.raise(input)]);
    expect(interventions.size).toBe(1);
    expect(notifications.size).toBe(1);
    expect(deliver).toHaveBeenCalledTimes(1);
  });

  it.each(["BOUNCED", "SUPPRESSED"] as const)("treats %s as a terminal transport state, not case truth", (deliveryStatus) => {
    const record = {
      notificationId: "notification_12345678", dedupeKey: `sha256:${"a".repeat(64)}`,
      caseId: "mission_12345678", correlationId: "corr_12345678", ownerId: "owner_12345678",
      kind: "NEEDS_ATTENTION", deepLinkPath: "/cases/mission_12345678/result",
      createdAt: "2026-08-17T19:00:00.000Z", deliveryChannel: "EMAIL", deliveryStatus
    } satisfies NotificationRecord;
    expect(record.deliveryStatus).toBe(deliveryStatus);
    expect(record.kind).toBe("NEEDS_ATTENTION");
  });
});
