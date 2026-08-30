import { describe, expect, it, vi } from "vitest";
import {
  NotificationDeliveryService,
  MissionNotificationService,
  notificationRecord,
  type NotificationRecord
} from "../src/notifications";
import { notificationSchema } from "@actionos/contracts";
import { InterventionService, type InterventionRecord } from "../src/interventions";

function fixture(): NotificationRecord {
  return notificationRecord({
    missionId: "case_12345678",
    ownerId: "owner_12345678",
    correlationId: "corr_12345678",
    kind: "CASE_COMPLETED",
    createdAt: "2026-08-16T12:00:00.000Z"
  });
}

describe("notification delivery", () => {
  it("delivers a newly persisted attention intervention exactly once", async () => {
    const deliver = vi.fn(() => Promise.resolve({
      receipt: { deliveryId: "email_attention_1234", acceptedAt: "2026-08-16T12:00:01.000Z" },
      duplicate: false
    }));
    const notifications = new Map<string, NotificationRecord>();
    const notificationStore = {
      createIfAbsent: (record: NotificationRecord) => {
        const prior = notifications.get(record.dedupeKey);
        if (prior) return Promise.resolve({ record: prior, duplicate: true });
        notifications.set(record.dedupeKey, record);
        return Promise.resolve({ record, duplicate: false });
      },
      updateDelivery: () => Promise.resolve()
    };
    const interventionStore = {
      createInterventionIfAbsent: (record: InterventionRecord) => Promise.resolve({ record, duplicate: false }),
      listInterventions: () => Promise.resolve([])
    };
    const service = new InterventionService(
      interventionStore,
      notificationStore,
      new NotificationDeliveryService(notificationStore, { deliver })
    );
    const input = {
      missionId: "case_12345678", ownerId: "owner_12345678", correlationId: "corr_attention_12345678",
      kind: "EVIDENCE_CONFLICT" as const, reasonCodes: ["UNEXPECTED_SENDER"],
      notificationRecipient: "owner@example.test", createdAt: "2026-08-16T12:00:00.000Z"
    };
    await service.raise(input);
    await service.raise(input);
    expect(deliver).toHaveBeenCalledTimes(1);
  });

  it("records unavailable without changing the durable notification", async () => {
    const updateDelivery = vi.fn(() => Promise.resolve());
    const service = new NotificationDeliveryService({
      createIfAbsent: (record) => Promise.resolve({ record, duplicate: false }),
      updateDelivery
    });
    await expect(service.deliver(fixture(), undefined)).resolves.toMatchObject({
      deliveryChannel: "IN_APP",
      deliveryStatus: "UNAVAILABLE"
    });
    expect(updateDelivery).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      deliveryStatus: "UNAVAILABLE"
    }));
  });

  it("projects provider acceptance but does not reinterpret case truth", async () => {
    const updateDelivery = vi.fn(() => Promise.resolve());
    const service = new NotificationDeliveryService({
      createIfAbsent: (record) => Promise.resolve({ record, duplicate: false }),
      updateDelivery
    }, {
      deliver: () => Promise.resolve({
        receipt: { deliveryId: "email_12345678", acceptedAt: "2026-08-16T12:00:01.000Z" },
        duplicate: false
      })
    });
    await expect(service.deliver(fixture(), "owner@example.test")).resolves.toMatchObject({
      deliveryChannel: "EMAIL",
      deliveryStatus: "ACCEPTED",
      deliveryId: "email_12345678"
    });
  });

  it("records provider failure instead of failing the completed case", async () => {
    const updateDelivery = vi.fn(() => Promise.resolve());
    const service = new NotificationDeliveryService({
      createIfAbsent: (record) => Promise.resolve({ record, duplicate: false }),
      updateDelivery
    }, { deliver: () => Promise.reject(new Error("provider down")) });
    await expect(service.deliver(fixture(), "owner@example.test")).resolves.toMatchObject({
      deliveryStatus: "FAILED"
    });
  });

  it("persists and delivers a terminal failure once under replay", async () => {
    const records = new Map<string, NotificationRecord>();
    const deliver = vi.fn(() => Promise.resolve({
      receipt: { deliveryId: "email_failed_1234", acceptedAt: "2026-08-16T12:00:01.000Z" },
      duplicate: false
    }));
    const store = {
      createIfAbsent: (record: NotificationRecord) => {
        const prior = records.get(record.dedupeKey);
        if (prior) return Promise.resolve({ record: prior, duplicate: true });
        records.set(record.dedupeKey, record);
        return Promise.resolve({ record, duplicate: false });
      },
      updateDelivery: () => Promise.resolve()
    };
    const service = new MissionNotificationService(store, new NotificationDeliveryService(store, { deliver }));
    const input = {
      missionId: "case_12345678", ownerId: "owner_12345678", kind: "CASE_FAILED" as const,
      createdAt: "2026-08-16T12:00:00.000Z", correlationId: "corr_failed_12345678",
      recipient: "owner@example.test"
    };
    await service.notify(input);
    await service.notify(input);
    expect(records.size).toBe(1);
    expect(deliver).toHaveBeenCalledTimes(1);
  });

  it.each(["BOUNCED", "SUPPRESSED"] as const)("accepts truthful %s delivery projection", (deliveryStatus) => {
    expect(notificationSchema.parse({
      ...fixture(),
      deliveryChannel: "EMAIL",
      deliveryStatus
    }).deliveryStatus).toBe(deliveryStatus);
  });
});
