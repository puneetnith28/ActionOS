import { stableHash } from "@actionos/domain";
import type { NotificationRecord } from "@actionos/runtime/notifications";

export interface EmailDeliveryReceipt {
  readonly deliveryId: string;
  readonly acceptedAt: string;
}

export interface EmailDeliveryStore {
  reserveDelivery(key: string): Promise<"RESERVED" | "IN_FLIGHT" | EmailDeliveryReceipt>;
  completeDelivery(key: string, receipt: EmailDeliveryReceipt): Promise<void>;
  failDelivery(key: string): Promise<void>;
}

export interface EmailTransport {
  send(input: {
    recipient: string;
    subject: string;
    text: string;
    idempotencyKey: string;
  }): Promise<EmailDeliveryReceipt>;
}

export class OutboundEmailAdapter {
  constructor(
    private readonly store: EmailDeliveryStore,
    private readonly transport: EmailTransport,
    private readonly publicBaseUrl: string
  ) {}

  async deliver(
    notification: NotificationRecord,
    recipient: string
  ): Promise<{ receipt: EmailDeliveryReceipt; duplicate: boolean }> {
    const key = stableHash({
      namespace: "dueback/outbound-email/v1",
      notificationDedupeKey: notification.dedupeKey,
      recipient
    });
    const reservation = await this.store.reserveDelivery(key);
    if (reservation !== "RESERVED") {
      if (reservation === "IN_FLIGHT") throw new Error("EMAIL_DELIVERY_IN_FLIGHT");
      return { receipt: reservation, duplicate: true };
    }
    const completed = notification.kind === "CASE_COMPLETED";
    try {
      const receipt = await this.transport.send({
        recipient,
        subject: completed ? "DueBack has merchant-confirmed proof" : "DueBack needs one decision",
        text: `${completed ? "The merchant confirmed the promised outcome." : "Your case needs a limited decision."}\n\nOpen: ${new URL(notification.deepLinkPath, this.publicBaseUrl).toString()}\n\nMerchant confirmation is not bank settlement or delivery proof.`,
        idempotencyKey: key
      });
      await this.store.completeDelivery(key, receipt);
      return { receipt, duplicate: false };
    } catch (error) {
      await this.store.failDelivery(key);
      throw error;
    }
  }
}

export class ResendEmailTransport implements EmailTransport {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
    private readonly request: typeof fetch = fetch
  ) {}

  async send(input: {
    recipient: string;
    subject: string;
    text: string;
    idempotencyKey: string;
  }): Promise<EmailDeliveryReceipt> {
    const response = await this.request("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        "content-type": "application/json",
        "idempotency-key": input.idempotencyKey
      },
      body: JSON.stringify({
        from: this.from,
        to: [input.recipient],
        subject: input.subject,
        text: input.text
      })
    });
    if (!response.ok) throw new Error(`EMAIL_TRANSPORT_${String(response.status)}`);
    const result = (await response.json()) as { id?: string };
    if (!result.id) throw new Error("EMAIL_TRANSPORT_RECEIPT_MISSING");
    return { deliveryId: result.id, acceptedAt: new Date().toISOString() };
  }
}
