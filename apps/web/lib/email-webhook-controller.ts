import { stableHash } from "@actionos/domain";
import {
  parseEmailProviderEvent,
  verifyEmailWebhook
} from "@actionos/capabilities/email-webhook";

export interface EmailProviderEventStore {
  reserveProviderEvent(input: {
    providerEventId: string;
    eventType: string;
    payloadHash: string;
    receivedAt: string;
  }): Promise<"RESERVED" | "IN_FLIGHT" | "COMPLETED">;
  markProviderEvent(
    providerEventId: string,
    status: "ENQUEUED" | "PROCESSED" | "FAILED",
    observedAt: string,
    reasonCodes?: readonly string[]
  ): Promise<void>;
}

export interface InboundTaskScheduler {
  scheduleInbound(input: {
    providerEventId: string;
    providerEmailId: string;
    eventType: string;
    wakeAt: string;
  }): Promise<{ taskName: string; duplicate: boolean }>;
}

export async function handleEmailWebhook(
  request: Request,
  dependencies: {
    readonly secret: string;
    readonly now: () => string;
    readonly events: EmailProviderEventStore;
    readonly scheduler: InboundTaskScheduler;
  }
): Promise<Response> {
  const body = await request.text();
  const id = request.headers.get("svix-id");
  const timestamp = request.headers.get("svix-timestamp");
  const signature = request.headers.get("svix-signature");
  const now = dependencies.now();
  if (!id || !timestamp || !signature) {
    return Response.json({ error: "EMAIL_WEBHOOK_AUTH_REQUIRED" }, { status: 401 });
  }
  if (!verifyEmailWebhook({ body, id, timestamp, signature, secret: dependencies.secret, now })) {
    return Response.json({ error: "EMAIL_WEBHOOK_SIGNATURE_INVALID" }, { status: 401 });
  }
  try {
    const event = parseEmailProviderEvent(body);
    const payloadHash = stableHash(body);
    const reservation = await dependencies.events.reserveProviderEvent({
      providerEventId: id,
      eventType: event.type,
      payloadHash,
      receivedAt: now
    });
    if (reservation !== "RESERVED") {
      return Response.json({ providerEventId: id, status: reservation, duplicate: true }, { status: 202 });
    }
    try {
      await dependencies.scheduler.scheduleInbound({
        providerEventId: id,
        providerEmailId: event.data.email_id,
        eventType: event.type,
        wakeAt: now
      });
      await dependencies.events.markProviderEvent(id, "ENQUEUED", now);
      return Response.json({ providerEventId: id, status: "ENQUEUED", duplicate: false }, { status: 202 });
    } catch (error) {
      await dependencies.events.markProviderEvent(id, "FAILED", now, [
        error instanceof Error ? error.message : "EMAIL_TASK_SCHEDULE_FAILED"
      ]);
      throw error;
    }
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "EMAIL_WEBHOOK_FAILED" }, { status: 400 });
  }
}
