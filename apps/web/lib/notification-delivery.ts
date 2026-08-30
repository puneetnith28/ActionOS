import { OutboundEmailAdapter, ResendEmailTransport } from "@actionos/capabilities/outbound-email";
import { config } from "./config";
import type { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { NotificationDeliveryService } from "@actionos/runtime/notifications";

export function notificationDelivery(store: FirestoreRuntimeStore): NotificationDeliveryService {
  const apiKey = config.secrets.resendApiKey;
  const from = config.email.notificationFrom;
  const publicBaseUrl = config.urls.publicBaseUrl;
  if (!apiKey || !from || !publicBaseUrl) return new NotificationDeliveryService(store);
  return new NotificationDeliveryService(
    store,
    new OutboundEmailAdapter(store, new ResendEmailTransport(apiKey, from), publicBaseUrl)
  );
}
