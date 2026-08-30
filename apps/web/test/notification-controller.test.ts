import { describe, expect, it, vi } from "vitest";
import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import type { NotificationRecord } from "@actionos/runtime/notifications";
import { handleNotificationRetry } from "../lib/notification-controller";

const record = { notificationId: "notification_12345678", missionId: "mission_12345678", ownerId: "owner_12345678", deliveryStatus: "FAILED", attemptCount: 1 } as NotificationRecord;
const item = { missionId: record.missionId, ownerId: record.ownerId, plan: { notificationRecipient: "owner@example.test" } } as FollowThroughMission;

describe("notification retry controller", () => {
  it("retries one owned eligible notification with the plan destination", async () => {
    const deliver = vi.fn(() => Promise.resolve({ ...record, deliveryStatus: "ACCEPTED" as const, attemptCount: 2 }));
    const response = await handleNotificationRetry(new Request("https://actionos.test/retry", { method: "POST", body: "{}" }), record.missionId, {
      authenticate: () => Promise.resolve({ uid: record.ownerId }),
      store: { get: () => Promise.resolve(item), listNotifications: () => Promise.resolve([record]) },
      delivery: { deliver } as never
    });
    expect(response.status).toBe(202);
    expect(deliver).toHaveBeenCalledWith(record, "owner@example.test");
  });

  it.each(["DELIVERED", "BOUNCED", "SUPPRESSED"])("does not retry %s", async (deliveryStatus) => {
    const response = await handleNotificationRetry(new Request("https://actionos.test/retry", { method: "POST", body: "{}" }), record.missionId, {
      authenticate: () => Promise.resolve({ uid: record.ownerId }),
      store: { get: () => Promise.resolve(item), listNotifications: () => Promise.resolve([{ ...record, deliveryStatus } as NotificationRecord]) },
      delivery: { deliver: vi.fn() } as never
    });
    expect(response.status).toBe(409);
  });

  it("does not disclose another owner's notification", async () => {
    const response = await handleNotificationRetry(new Request("https://actionos.test/retry", { method: "POST", body: "{}" }), record.missionId, {
      authenticate: () => Promise.resolve({ uid: "other_12345678" }),
      store: { get: () => Promise.resolve(item), listNotifications: () => Promise.resolve([record]) },
      delivery: { deliver: vi.fn() } as never
    });
    expect(response.status).toBe(404);
  });
});
