import { ResendInboundEmailAdapter } from "@dueback/channel-adapters/inbound-email";
import { transportStatusForProviderEvent } from "@dueback/channel-adapters/email-webhook";
import { extractInboundFlow } from "@dueback/genkit-flows/extract-inbound";
import { FirestoreRuntimeStore } from "@dueback/persistence/runtime-store";
import { EvidenceService } from "@dueback/runtime/evidence-service";
import { InboundService } from "@dueback/runtime/inbound-service";
import { InterventionService } from "@dueback/runtime/interventions";
import { firestore } from "../../../../../lib/firebase-admin";
import { notificationDelivery } from "../../../../../lib/notification-delivery";
import { caseScheduler } from "../../../../../lib/case-scheduler";
import { requireCloudTaskIdentity } from "../../../../../lib/cloud-task-identity";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const unauthorized = await requireCloudTaskIdentity(request);
  if (unauthorized) return unauthorized;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return Response.json({ error: "INBOUND_EMAIL_NOT_CONFIGURED" }, { status: 503 });
  const store = new FirestoreRuntimeStore(firestore);
  let providerEventId: string | undefined;
  try {
    const body = await request.json() as {
      providerEventId?: string;
      providerEmailId?: string;
      eventType?: string;
    };
    if (!body.providerEventId || !body.providerEmailId || !body.eventType) {
      return Response.json({ error: "INBOUND_TASK_INVALID" }, { status: 400 });
    }
    providerEventId = body.providerEventId;
    const observedAt = new Date().toISOString();
    const transportStatus = transportStatusForProviderEvent(body.eventType);
    if (transportStatus) {
      const actionStatus = await store.recordTransportEvent(
        body.providerEmailId,
        transportStatus,
        observedAt
      );
      const notificationStatus = actionStatus === "UNKNOWN"
        ? await store.recordNotificationTransportEvent(
            body.providerEmailId,
            transportStatus,
            observedAt
          )
        : "UNKNOWN";
      await store.markProviderEvent(body.providerEventId, "PROCESSED", observedAt);
      return Response.json({ actionStatus, notificationStatus, transportStatus });
    }
    if (body.eventType !== "email.received") {
      await store.markProviderEvent(body.providerEventId, "PROCESSED", observedAt, ["NON_INBOUND_EVENT"]);
      return Response.json({ status: "IGNORED", reasonCodes: ["NON_INBOUND_EVENT"] });
    }
    const interventions = new InterventionService(store, store, notificationDelivery(store));
    const service = new InboundService(
      store,
      { interpret: (input) => extractInboundFlow(input) },
      new EvidenceService(
        store,
        store,
        store,
        notificationDelivery(store),
        caseScheduler()
      ),
      interventions
    );
    const email = await new ResendInboundEmailAdapter(apiKey).retrieve(body.providerEmailId);
    await store.recordInboundEnvelope({
      providerEventId: body.providerEventId,
      providerEmailId: email.providerEmailId,
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      receivedAt: observedAt
    });
    const result = await service.process(email, observedAt);
    await store.markProviderEvent(body.providerEventId, "PROCESSED", observedAt, result.reasonCodes);
    return Response.json(result);
  } catch (error) {
    if (providerEventId) {
      await store.markProviderEvent(providerEventId, "FAILED", new Date().toISOString(), [
        error instanceof Error ? error.message : "INBOUND_PROCESSING_FAILED"
      ]);
    }
    return Response.json({ error: error instanceof Error ? error.message : "INBOUND_PROCESSING_FAILED" }, { status: 500 });
  }
}
