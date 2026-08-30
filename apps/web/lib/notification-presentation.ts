import type { NotificationRecord } from "@dueback/runtime/notifications";

export function notificationPresentation(record: NotificationRecord) {
  const inAppOnly = record.deliveryChannel === "IN_APP";
  const status = inAppOnly ? "RECORDED" : (record.deliveryStatus ?? "RECORDED");
  const copy = {
    RECORDED: "Saved in your case",
    ACCEPTED: "Email accepted by the provider",
    DELIVERED: "Delivered to the recipient mail server",
    BOUNCED: "Email bounced — delivery stopped",
    SUPPRESSED: "Email suppressed — no more sends",
    FAILED: "Email delivery failed",
    UNAVAILABLE: "Email delivery is unavailable"
  }[status];
  return {
    copy,
    canRetry: !inAppOnly && ["FAILED", "UNAVAILABLE"].includes(status) && (record.attemptCount ?? 0) < 3,
    inAppOnly,
    destination: record.destinationHint ?? (record.deliveryChannel === "EMAIL" ? "your verified email" : "this case"),
    attempts: record.attemptCount ?? 0
  };
}
