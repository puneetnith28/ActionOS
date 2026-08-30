import { OutboundEmailAdapter, ResendEmailTransport } from "@dueback/channel-adapters/outbound-email";
import type { FirestoreRuntimeStore } from "@dueback/persistence/runtime-store";
import { NotificationDeliveryService } from "@dueback/runtime/notifications";

export function notificationDelivery(store: FirestoreRuntimeStore): NotificationDeliveryService {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DUEBACK_NOTIFICATION_FROM ?? process.env.COMPANY_EMAIL_FROM;
  const publicBaseUrl = process.env.DUEBACK_PUBLIC_BASE_URL;
  if (!apiKey || !from || !publicBaseUrl) return new NotificationDeliveryService(store);
  return new NotificationDeliveryService(
    store,
    new OutboundEmailAdapter(store, new ResendEmailTransport(apiKey, from), publicBaseUrl)
  );
}
