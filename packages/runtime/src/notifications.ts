import { stableHash } from "@actionos/domain";

export type NotificationKind = "NEEDS_ATTENTION" | "CASE_COMPLETED" | "CASE_FAILED";

export interface NotificationRecord {
  readonly notificationId: string;
  readonly dedupeKey: string;
  readonly missionId: string;
  readonly correlationId: string;
  readonly ownerId: string;
  readonly kind: NotificationKind;
  readonly deepLinkPath: string;
  readonly createdAt: string;
  readonly deliveryChannel?: "IN_APP" | "EMAIL";
  readonly deliveryStatus?:
    | "RECORDED"
    | "ACCEPTED"
    | "DELIVERED"
    | "BOUNCED"
    | "SUPPRESSED"
    | "FAILED"
    | "UNAVAILABLE";
  readonly deliveryId?: string;
  readonly deliveredAt?: string;
  readonly destinationHint?: string;
  readonly attemptCount?: number;
  readonly lastAttemptAt?: string;
}

export interface NotificationStore {
  createIfAbsent(
    record: NotificationRecord
  ): Promise<{ record: NotificationRecord; duplicate: boolean }>;
  updateDelivery?(
    dedupeKey: string,
    update: Pick<NotificationRecord, "deliveryChannel" | "deliveryStatus"> & {
      deliveryId?: string;
      deliveredAt?: string;
      destinationHint?: string;
      attemptCount?: number;
      lastAttemptAt?: string;
    }
  ): Promise<void>;
  listNotifications?(missionId: string): Promise<readonly NotificationRecord[]>;
}

export interface NotificationDeliveryAdapter {
  deliver(
    notification: NotificationRecord,
    recipient: string
  ): Promise<{ receipt: { deliveryId: string; acceptedAt: string }; duplicate: boolean }>;
}

export class NotificationDeliveryService {
  constructor(
    private readonly store: NotificationStore,
    private readonly adapter?: NotificationDeliveryAdapter
  ) {}

  async deliver(record: NotificationRecord, recipient: string | undefined): Promise<NotificationRecord> {
    const attempt = (record.attemptCount ?? 0) + 1;
    const attemptedAt = new Date().toISOString();
    const destinationHint = recipient?.includes("@")
      ? recipient.replace(/(^.).*(@.*$)/, "$1•••$2")
      : undefined;
    if (!recipient || !this.adapter) {
      await this.store.updateDelivery?.(record.dedupeKey, {
        deliveryChannel: "IN_APP",
        deliveryStatus: "UNAVAILABLE",
        attemptCount: attempt,
        lastAttemptAt: attemptedAt
      });
      return { ...record, deliveryChannel: "IN_APP", deliveryStatus: "UNAVAILABLE", attemptCount: attempt, lastAttemptAt: attemptedAt };
    }
    try {
      const result = await this.adapter.deliver(record, recipient);
      const update = {
        deliveryChannel: "EMAIL" as const,
        deliveryStatus: "ACCEPTED" as const,
        deliveryId: result.receipt.deliveryId,
        ...(destinationHint ? { destinationHint } : {}),
        attemptCount: attempt,
        lastAttemptAt: result.receipt.acceptedAt
      };
      await this.store.updateDelivery?.(record.dedupeKey, update);
      return { ...record, ...update };
    } catch {
      const update = {
        deliveryChannel: "EMAIL" as const,
        deliveryStatus: "FAILED" as const,
        ...(destinationHint ? { destinationHint } : {}),
        attemptCount: attempt,
        lastAttemptAt: attemptedAt
      };
      await this.store.updateDelivery?.(record.dedupeKey, update);
      return { ...record, ...update };
    }
  }
}

export class MissionNotificationService {
  constructor(
    private readonly store: NotificationStore,
    private readonly delivery?: NotificationDeliveryService
  ) {}

  async notify(input: {
    missionId: string;
    ownerId: string;
    kind: NotificationKind;
    createdAt: string;
    correlationId: string;
    recipient?: string;
  }): Promise<NotificationRecord> {
    const persisted = await this.store.createIfAbsent(notificationRecord(input));
    if (persisted.duplicate || !this.delivery) return persisted.record;
    return this.delivery.deliver(persisted.record, input.recipient);
  }
}

export function notificationRecord(input: {
  missionId: string;
  ownerId: string;
  kind: NotificationKind;
  createdAt: string;
  correlationId: string;
}): NotificationRecord {
  const dedupeKey = stableHash({
    namespace: "dueback/notification/v1",
    missionId: input.missionId,
    correlationId: input.correlationId,
    kind: input.kind
  });
  return {
    notificationId: `notification_${dedupeKey.slice(7, 31)}`,
    dedupeKey,
    missionId: input.missionId,
    correlationId: input.correlationId,
    ownerId: input.ownerId,
    kind: input.kind,
    deepLinkPath: `/cases/${input.missionId}/result`,
    createdAt: input.createdAt,
    deliveryChannel: "IN_APP",
    deliveryStatus: "RECORDED"
  };
}
