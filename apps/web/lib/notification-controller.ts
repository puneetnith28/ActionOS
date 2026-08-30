import type { FollowThroughMission } from "@actionos/runtime/case-runner";
import type { NotificationDeliveryService, NotificationRecord } from "@actionos/runtime/notifications";

export interface NotificationRetryStore {
  get(missionId: string): Promise<FollowThroughMission | undefined>;
  listNotifications(missionId: string): Promise<readonly NotificationRecord[]>;
}

export async function handleNotificationRetry(
  request: Request,
  missionId: string,
  dependencies: {
    authenticate: (request: Request) => Promise<{ uid: string }>;
    store: NotificationRetryStore;
    delivery: NotificationDeliveryService;
  }
): Promise<Response> {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const owner = await dependencies.authenticate(request);
    const item = await dependencies.store.get(missionId);
    if (!item || item.ownerId !== owner.uid) return Response.json({ error: "CASE_NOT_FOUND" }, { status: 404, headers });
    const body = await request.json() as { notificationId?: string };
    const notifications = await dependencies.store.listNotifications(missionId);
    const record = body.notificationId
      ? notifications.find((candidate) => candidate.notificationId === body.notificationId)
      : notifications.at(-1);
    if (!record) return Response.json({ error: "NOTIFICATION_NOT_FOUND" }, { status: 404, headers });
    if (!["FAILED", "UNAVAILABLE"].includes(record.deliveryStatus ?? "") || (record.attemptCount ?? 0) >= 3)
      return Response.json({ error: "NOTIFICATION_NOT_RETRYABLE" }, { status: 409, headers });
    if (!item.plan.notificationRecipient)
      return Response.json({ error: "NOTIFICATION_DESTINATION_UNAVAILABLE" }, { status: 409, headers });
    const retried = await dependencies.delivery.deliver(record, item.plan.notificationRecipient);
    return Response.json({ notification: retried }, { status: 202, headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "NOTIFICATION_RETRY_FAILED";
    const auth = ["AUTHENTICATION_REQUIRED", "INVALID_ID_TOKEN"].includes(code);
    return Response.json({ error: auth ? code : "NOTIFICATION_RETRY_FAILED" }, { status: auth ? 401 : 500, headers });
  }
}
