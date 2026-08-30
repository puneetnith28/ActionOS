import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { ActionReceipt, ActionRecordStore, Reservation } from "@dueback/runtime/action-broker";
import type { ExternalSendBudget } from "@dueback/runtime/action-broker";
import type { FollowThroughCase, FollowThroughStore } from "@dueback/runtime/case-runner";
import type { EvidenceCaseStore, EvidenceRecord } from "@dueback/runtime/evidence-service";
import type { NotificationRecord, NotificationStore } from "@dueback/runtime/notifications";
import type { InterventionRecord, InterventionStore } from "@dueback/runtime/interventions";
import type {
  EmailDeliveryReceipt,
  EmailDeliveryStore
} from "@dueback/channel-adapters/outbound-email";
import { firestoreDeleteAt } from "./expiry";
import type { RuntimeTimelineEvent } from "@dueback/runtime/timeline";
import { stableHash } from "@dueback/domain";
import type { TechnicalRunSource } from "@dueback/runtime/technical-run";
import type { DraftCase } from "@dueback/runtime/intake-service";
import type { WakeIntent } from "@dueback/runtime/wake-outbox";
import { persistWakeIntent } from "./wake-outbox-store";

export class FirestoreRuntimeStore
  implements
    FollowThroughStore,
    ActionRecordStore,
    EvidenceCaseStore,
    NotificationStore,
    InterventionStore,
    EmailDeliveryStore,
    ExternalSendBudget
{
  constructor(private readonly db: Firestore) {}

  async reserveExternalSend(input: {
    ownerId: string;
    caseId: string;
    recipient: string;
    channelType: string;
    requestedAt: string;
    idempotencyKey: string;
  }): Promise<void> {
    const day = input.requestedAt.slice(0, 10);
    const ownerHash = stableHash(input.ownerId).slice(7, 31);
    const recipientHash = stableHash(input.recipient.toLowerCase()).slice(7, 31);
    const domain = input.recipient.includes("@") ? input.recipient.split("@").at(-1)?.toLowerCase() ?? "none" : "none";
    const domainHash = stableHash(domain).slice(7, 31);
    const references = [
      { ref: this.db.collection("externalSendBudgets").doc(`${ownerHash}-${day}-recipient-${recipientHash}`), limit: 3 },
      { ref: this.db.collection("externalSendBudgets").doc(`${ownerHash}-${day}-domain-${domainHash}`), limit: 10 },
      { ref: this.db.collection("externalSendBudgets").doc(`${ownerHash}-${day}-channel-${input.channelType}`), limit: 10 }
    ];
    const reservation = this.db.collection("externalSendReservations").doc(stableHash(input.idempotencyKey).slice(7, 39));
    await this.db.runTransaction(async (transaction) => {
      const prior = await transaction.get(reservation);
      if (prior.exists) return;
      const snapshots = await Promise.all(references.map(({ ref }) => transaction.get(ref)));
      for (const [index, snapshot] of snapshots.entries()) {
        if (Number(snapshot.get("count") ?? 0) >= (references[index]?.limit ?? 0)) {
          throw new Error("EXTERNAL_SEND_BUDGET_EXHAUSTED");
        }
      }
      for (const { ref } of references) {
        transaction.set(ref, {
          ownerHash,
          day,
          count: FieldValue.increment(1),
          updatedAt: input.requestedAt,
          deleteAt: firestoreDeleteAt(input.requestedAt, 2 * 86_400_000)
        }, { merge: true });
      }
      transaction.create(reservation, {
        idempotencyKey: input.idempotencyKey,
        caseId: input.caseId,
        createdAt: input.requestedAt,
        deleteAt: firestoreDeleteAt(input.requestedAt)
      });
    });
  }

  async get(caseId: string): Promise<FollowThroughCase | undefined> {
    const document = await this.db.collection("caseRuns").doc(caseId).get();
    return document.exists ? (document.data() as FollowThroughCase) : undefined;
  }

  async listByOwner(ownerId: string, limit: number): Promise<readonly FollowThroughCase[]> {
    const snapshot = await this.db
      .collection("caseRuns")
      .where("ownerId", "==", ownerId)
      .limit(Math.min(Math.max(limit, 1), 50))
      .get();
    return snapshot.docs.map((document) => document.data() as FollowThroughCase);
  }

  async listEvidence(caseId: string): Promise<readonly EvidenceRecord[]> {
    const snapshot = await this.db
      .collection("caseRuns")
      .doc(caseId)
      .collection("evidence")
      .orderBy("recordedAt", "asc")
      .limit(50)
      .get();
    return snapshot.docs.map((document) => document.data() as EvidenceRecord);
  }

  async listEvents(caseId: string): Promise<readonly RuntimeTimelineEvent[]> {
    const snapshot = await this.db
      .collection("caseRuns")
      .doc(caseId)
      .collection("events")
      .orderBy("sequence", "asc")
      .get();
    return snapshot.docs.map((document) => document.data() as RuntimeTimelineEvent);
  }

  async listChannelEvents(caseId: string): Promise<readonly {
    channelType: string;
    transportStatus: string;
    acceptedAt: string;
    observedAt?: string;
  }[]> {
    const snapshot = await this.db
      .collection("actionRecords")
      .where("receipt.caseId", "==", caseId)
      .limit(20)
      .get();
    return snapshot.docs.map((document) => {
      const receipt = document.get("receipt") as ActionReceipt & {
        transportStatus?: string;
        observedAt?: string;
      };
      return {
        channelType: receipt.channelType ?? "CONTROLLED_SANDBOX",
        transportStatus: receipt.transportStatus ?? "ACCEPTED",
        acceptedAt: receipt.acceptedAt,
        ...(receipt.observedAt ? { observedAt: receipt.observedAt } : {})
      };
    });
  }

  async compareAndSet(
    caseId: string,
    expectedVersion: number,
    next: FollowThroughCase,
    wake?: WakeIntent
  ): Promise<void> {
    const reference = this.db.collection("caseRuns").doc(caseId);
    await this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (!current.exists) throw new Error("CASE_NOT_FOUND");
      if (current.get("version") !== expectedVersion) throw new Error("VERSION_CONFLICT");
      const occurredAt = next.updatedAt ?? next.lastAttemptAt ?? new Date().toISOString();
      transaction.set(reference, { ...next, updatedAt: occurredAt });
      persistWakeIntent(transaction, this.db, wake);
      const eventId = `${String(next.version).padStart(6, "0")}-action-result`;
      transaction.create(reference.collection("events").doc(eventId), {
        eventId,
        caseId,
        sequence: next.version,
        type: "ACTION_RESULT",
        actor: "SYSTEM",
        occurredAt,
        reasonCodes: [
          next.lastError ?? (next.lastActionDuplicate ? "DUPLICATE_NO_OP" : "ACTION_ACCEPTED")
        ],
        correlationId: next.correlationId ?? "corr_unavailable",
        state: next.state,
        ...(next.lastReceiptId ? { receiptId: next.lastReceiptId } : {}),
        ...(next.lastActionIdempotencyKey ? { idempotencyKey: next.lastActionIdempotencyKey } : {}),
        deleteAt: firestoreDeleteAt(occurredAt)
      });
    });
  }

  async reserve(idempotencyKey: string): Promise<Reservation> {
    const reference = this.db.collection("actionRecords").doc(idempotencyKey.slice(7));
    return this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (current.exists) {
        const record = current.data() as { status: string; receipt?: ActionReceipt };
        return record.status === "SUCCEEDED" && record.receipt
          ? { status: "SUCCEEDED" as const, receipt: record.receipt }
          : { status: "IN_FLIGHT" as const };
      }
      transaction.create(reference, {
        status: "RESERVED",
        idempotencyKey,
        deleteAt: firestoreDeleteAt(new Date().toISOString())
      });
      return { status: "RESERVED" as const };
    });
  }

  async succeed(idempotencyKey: string, receipt: ActionReceipt): Promise<void> {
    const actionReference = this.db.collection("actionRecords").doc(idempotencyKey.slice(7));
    const batch = this.db.batch();
    batch.set(actionReference, {
        status: "SUCCEEDED",
        idempotencyKey,
        receipt,
        deleteAt: firestoreDeleteAt(new Date().toISOString())
      });
    if (receipt.replyRoute && receipt.caseId) {
      const routeKey = stableHash({
        namespace: "dueback/reply-route/v1",
        replyRoute: receipt.replyRoute.toLowerCase()
      });
      batch.set(this.db.collection("messageThreads").doc(routeKey.slice(7)), {
        routeKey,
        replyRoute: receipt.replyRoute.toLowerCase(),
        caseId: receipt.caseId,
        channelType: receipt.channelType ?? "MANAGED_EMAIL",
        providerMessageId: receipt.providerMessageId ?? receipt.receiptId,
        createdAt: receipt.acceptedAt,
        deleteAt: firestoreDeleteAt(receipt.acceptedAt)
      });
    }
    await batch.commit();
  }

  async caseForReplyRoute(replyRoute: string): Promise<string | undefined> {
    const routeKey = stableHash({
      namespace: "dueback/reply-route/v1",
      replyRoute: replyRoute.toLowerCase()
    });
    const document = await this.db.collection("messageThreads").doc(routeKey.slice(7)).get();
    return document.exists ? document.get("caseId") as string : undefined;
  }

  async caseForProviderMessageId(providerMessageId: string): Promise<string | undefined> {
    const snapshot = await this.db.collection("messageThreads")
      .where("providerMessageId", "==", providerMessageId)
      .limit(2)
      .get();
    if (snapshot.size !== 1) return undefined;
    return snapshot.docs[0]?.get("caseId") as string | undefined;
  }

  async recordTransportEvent(
    providerMessageId: string,
    transportStatus: "DELIVERED" | "BOUNCED" | "COMPLAINED" | "SUPPRESSED",
    observedAt: string
  ): Promise<"RECORDED" | "UNKNOWN" | "AMBIGUOUS"> {
    const snapshot = await this.db
      .collection("actionRecords")
      .where("receipt.providerMessageId", "==", providerMessageId)
      .limit(2)
      .get();
    if (snapshot.empty) return "UNKNOWN";
    if (snapshot.size !== 1) return "AMBIGUOUS";
    const actionDocument = snapshot.docs[0];
    if (!actionDocument) return "UNKNOWN";
    const receipt = actionDocument.get("receipt") as ActionReceipt;
    await actionDocument.ref.set({
      receipt: { ...receipt, transportStatus, observedAt },
      deleteAt: firestoreDeleteAt(observedAt)
    }, { merge: true });
    const caseId = receipt.caseId;
    if (caseId && ["BOUNCED", "COMPLAINED", "SUPPRESSED"].includes(transportStatus)) {
      const caseReference = this.db.collection("caseRuns").doc(caseId);
      await this.db.runTransaction(async (transaction) => {
        const current = await transaction.get(caseReference);
        if (!current.exists || ["DONE", "CANCELLED"].includes(String(current.get("state")))) return;
        const correlationId = String(current.get("correlationId") ?? `corr_${caseId.slice(-24)}`);
        const ownerId = String(current.get("ownerId"));
        const interventionKey = stableHash({
          namespace: "dueback/intervention/v1",
          caseId,
          kind: "EMAIL_ROUTE_UNAVAILABLE"
        });
        const notificationKey = stableHash({
          namespace: "dueback/notification/v1",
          caseId,
          correlationId,
          kind: "NEEDS_ATTENTION"
        });
        const interventionReference = this.db.collection("interventions").doc(interventionKey.slice(7));
        const notificationReference = this.db.collection("notifications").doc(notificationKey.slice(7));
        const [intervention, notification] = await Promise.all([
          transaction.get(interventionReference),
          transaction.get(notificationReference)
        ]);
        transaction.update(caseReference, {
          state: "NEEDS_ATTENTION",
          version: Number(current.get("version")) + 1,
          lastError: `EMAIL_${transportStatus}`,
          updatedAt: observedAt,
          deleteAt: firestoreDeleteAt(observedAt)
        });
        if (!intervention.exists) {
          transaction.create(interventionReference, {
            interventionId: `intervention_${interventionKey.slice(7, 31)}`,
            dedupeKey: interventionKey,
            caseId,
            ownerId,
            correlationId,
            kind: "EVIDENCE_CONFLICT",
            reasonCodes: [`EMAIL_${transportStatus}`],
            requestedField: "contact route",
            status: "OPEN",
            createdAt: observedAt,
            deleteAt: firestoreDeleteAt(observedAt)
          });
        }
        if (!notification.exists) {
          transaction.create(notificationReference, {
            notificationId: `notification_${notificationKey.slice(7, 31)}`,
            dedupeKey: notificationKey,
            caseId,
            ownerId,
            correlationId,
            kind: "NEEDS_ATTENTION",
            deepLinkPath: `/cases/${caseId}/result`,
            createdAt: observedAt,
            deliveryChannel: "IN_APP",
            deliveryStatus: "RECORDED",
            deleteAt: firestoreDeleteAt(observedAt)
          });
        }
      });
    }
    return "RECORDED";
  }

  async recordNotificationTransportEvent(
    providerMessageId: string,
    transportStatus: "DELIVERED" | "BOUNCED" | "COMPLAINED" | "SUPPRESSED",
    observedAt: string
  ): Promise<"RECORDED" | "UNKNOWN" | "AMBIGUOUS"> {
    const snapshot = await this.db.collection("notifications")
      .where("deliveryId", "==", providerMessageId)
      .limit(2)
      .get();
    if (snapshot.empty) return "UNKNOWN";
    if (snapshot.size !== 1) return "AMBIGUOUS";
    const document = snapshot.docs[0];
    if (!document) return "UNKNOWN";
    const deliveryStatus = transportStatus === "COMPLAINED" ? "SUPPRESSED" : transportStatus;
    await document.ref.set({
      deliveryStatus,
      deliveredAt: observedAt,
      deleteAt: firestoreDeleteAt(observedAt)
    }, { merge: true });
    return "RECORDED";
  }

  async fail(idempotencyKey: string, reasonCode: string): Promise<void> {
    await this.db.collection("actionRecords").doc(idempotencyKey.slice(7)).delete();
    await this.db.collection("actionFailures").add({
      idempotencyKey,
      reasonCode,
      occurredAt: new Date().toISOString(),
      deleteAt: firestoreDeleteAt(new Date().toISOString())
    });
  }

  async markUnknown(input: {
    idempotencyKey: string;
    caseId: string;
    ownerId: string;
    channelType: string;
    recipientFingerprint: string;
    correlationId?: string;
    reasonCode: string;
    observedAt: string;
  }): Promise<void> {
    await this.db.collection("actionRecords").doc(input.idempotencyKey.slice(7)).set({
      status: "UNKNOWN",
      ...input,
      deleteAt: firestoreDeleteAt(input.observedAt)
    }, { merge: true });
  }

  async record(input: {
    caseId: string;
    expectedVersion: number;
    nextState: FollowThroughCase["state"];
    nextWakeAt?: string;
    evidence: EvidenceRecord;
    wake?: WakeIntent;
  }): Promise<{ duplicate: boolean }> {
    const caseRef = this.db.collection("caseRuns").doc(input.caseId);
    const evidenceRef = caseRef.collection("evidence").doc(input.evidence.candidate.evidenceId);
    return this.db.runTransaction(async (transaction) => {
      const [item, prior] = await Promise.all([
        transaction.get(caseRef),
        transaction.get(evidenceRef)
      ]);
      if (!item.exists) throw new Error("CASE_NOT_FOUND");
      if (prior.exists) return { duplicate: true };
      if (item.get("version") !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
      transaction.create(evidenceRef, {
        ...input.evidence,
        deleteAt: firestoreDeleteAt(input.evidence.recordedAt)
      });
      transaction.update(caseRef, {
        state: input.nextState,
        version: input.expectedVersion + 1,
        updatedAt: input.evidence.recordedAt,
        nextWakeAt: input.nextWakeAt ?? FieldValue.delete(),
        ...(input.nextState === "DONE"
          ? {
              completedLevel: input.evidence.candidate.level,
              deleteAt: firestoreDeleteAt(input.evidence.recordedAt)
            }
          : {})
      });
      persistWakeIntent(transaction, this.db, input.wake);
      const sequence = input.expectedVersion + 1;
      const eventId = `${String(sequence).padStart(6, "0")}-evidence-result-${input.evidence.candidate.evidenceId.slice(-8)}`;
      transaction.create(caseRef.collection("events").doc(eventId), {
        eventId,
        caseId: input.caseId,
        sequence,
        type: "EVIDENCE_RESULT",
        actor: "COUNTERPARTY",
        occurredAt: input.evidence.recordedAt,
        reasonCodes: input.evidence.verification.reasonCodes,
        correlationId: input.evidence.correlationId,
        state: input.nextState,
        evidenceId: input.evidence.candidate.evidenceId,
        deleteAt: firestoreDeleteAt(input.evidence.recordedAt)
      });
      return { duplicate: false };
    });
  }

  async createIfAbsent(
    record: NotificationRecord
  ): Promise<{ record: NotificationRecord; duplicate: boolean }> {
    const reference = this.db.collection("notifications").doc(record.dedupeKey.slice(7));
    return this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (current.exists) return { record: current.data() as NotificationRecord, duplicate: true };
      const existingForCase = await transaction.get(
        this.db.collection("notifications").where("caseId", "==", record.caseId)
      );
      if (existingForCase.size >= 3) throw new Error("NOTIFICATION_BUDGET_EXHAUSTED");
      transaction.create(reference, { ...record, deleteAt: firestoreDeleteAt(record.createdAt) });
      return { record, duplicate: false };
    });
  }

  async updateDelivery(
    dedupeKey: string,
    update: Pick<NotificationRecord, "deliveryChannel" | "deliveryStatus"> & {
      deliveryId?: string;
      deliveredAt?: string;
      destinationHint?: string;
      attemptCount?: number;
      lastAttemptAt?: string;
    }
  ): Promise<void> {
    await this.db.collection("notifications").doc(dedupeKey.slice(7)).set(update, { merge: true });
  }

  async listNotifications(caseId: string): Promise<readonly NotificationRecord[]> {
    const snapshot = await this.db
      .collection("notifications")
      .where("caseId", "==", caseId)
      .orderBy("createdAt", "asc")
      .get();
    return snapshot.docs.map((document) => document.data() as NotificationRecord);
  }

  async technicalRunSource(caseId: string): Promise<TechnicalRunSource> {
    const [run, draft, events, evidence, notifications, channelEvents] = await Promise.all([
      this.get(caseId),
      this.db.collection("caseDrafts").doc(caseId).get(),
      this.listEvents(caseId),
      this.listEvidence(caseId),
      this.listNotifications(caseId),
      this.listChannelEvents(caseId)
    ]);
    let modelUsage: TechnicalRunSource["modelUsage"];
    if (run && draft.exists) {
      const typedDraft = draft.data() as DraftCase;
      const budgetKey = `${run.ownerId}:${typedDraft.artifactId}`;
      const usage = await this.db.collection("modelUsage").doc(stableHash(budgetKey).slice(7, 39)).get();
      if (usage.exists) {
        const usageData = usage.data() as {
          lastStatus?: unknown;
          lastObservedAt?: unknown;
          totalLatencyMs?: unknown;
          totalTokens?: unknown;
          estimatedCostUsd?: unknown;
        };
        const lastStatus = usageData.lastStatus;
        const lastObservedAt = usageData.lastObservedAt;
        modelUsage = {
          ...(lastStatus === "SUCCEEDED" || lastStatus === "FAILED" ? { lastStatus } : {}),
          ...(typeof lastObservedAt === "string" ? { lastObservedAt } : {}),
          ...(typeof usageData.totalLatencyMs === "number"
            ? { totalLatencyMs: usageData.totalLatencyMs }
            : {}),
          ...(typeof usageData.totalTokens === "number" ? { totalTokens: usageData.totalTokens } : {}),
          ...(typeof usageData.estimatedCostUsd === "number"
            ? { estimatedCostUsd: usageData.estimatedCostUsd }
            : {})
        };
      }
    }
    return {
      ...(modelUsage ? { modelUsage } : {}),
      hasTypedDraft: draft.exists,
      events,
      evidence,
      notifications,
      channelEvents
    };
  }

  async createInterventionIfAbsent(
    record: InterventionRecord
  ): Promise<{ record: InterventionRecord; duplicate: boolean }> {
    const reference = this.db.collection("interventions").doc(record.dedupeKey.slice(7));
    return this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (current.exists) return { record: current.data() as InterventionRecord, duplicate: true };
      transaction.create(reference, { ...record, deleteAt: firestoreDeleteAt(record.createdAt) });
      return { record, duplicate: false };
    });
  }

  async listInterventions(caseId: string): Promise<readonly InterventionRecord[]> {
    const snapshot = await this.db
      .collection("interventions")
      .where("caseId", "==", caseId)
      .orderBy("createdAt", "asc")
      .get();
    return snapshot.docs.map((document) => document.data() as InterventionRecord);
  }

  async reserveDelivery(key: string): Promise<"RESERVED" | "IN_FLIGHT" | EmailDeliveryReceipt> {
    const reference = this.db.collection("emailDeliveries").doc(key.slice(7));
    return this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (current.exists) {
        const data = current.data() as { status: string; receipt?: EmailDeliveryReceipt };
        return data.status === "COMPLETED" && data.receipt ? data.receipt : "IN_FLIGHT";
      }
      transaction.create(reference, {
        status: "IN_FLIGHT",
        key,
        deleteAt: firestoreDeleteAt(new Date().toISOString())
      });
      return "RESERVED";
    });
  }

  async completeDelivery(key: string, receipt: EmailDeliveryReceipt): Promise<void> {
    await this.db
      .collection("emailDeliveries")
      .doc(key.slice(7))
      .set({
        status: "COMPLETED",
        key,
        receipt,
        deleteAt: firestoreDeleteAt(new Date().toISOString())
      });
  }

  async failDelivery(key: string): Promise<void> {
    await this.db.collection("emailDeliveries").doc(key.slice(7)).delete();
  }

  async reserveProviderEvent(input: {
    providerEventId: string;
    eventType: string;
    payloadHash: string;
    receivedAt: string;
  }): Promise<"RESERVED" | "IN_FLIGHT" | "COMPLETED"> {
    const reference = this.db.collection("providerEvents")
      .doc(stableHash(input.providerEventId).slice(7, 39));
    return this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (current.exists) {
        const status = String(current.get("status"));
        return status === "PROCESSED" ? "COMPLETED" : "IN_FLIGHT";
      }
      transaction.create(reference, {
        ...input,
        provider: "RESEND",
        signatureValid: true,
        status: "RESERVED",
        reasonCodes: [],
        deleteAt: firestoreDeleteAt(input.receivedAt)
      });
      return "RESERVED";
    });
  }

  async markProviderEvent(
    providerEventId: string,
    status: "ENQUEUED" | "PROCESSED" | "FAILED",
    observedAt: string,
    reasonCodes: readonly string[] = []
  ): Promise<void> {
    await this.db.collection("providerEvents")
      .doc(stableHash(providerEventId).slice(7, 39))
      .set({
        status,
        processedAt: status === "PROCESSED" ? observedAt : null,
        lastObservedAt: observedAt,
        reasonCodes: [...reasonCodes].slice(0, 10),
        deleteAt: firestoreDeleteAt(observedAt)
      }, { merge: true });
  }

  async recordInboundEnvelope(input: {
    providerEventId: string;
    providerEmailId: string;
    from: string;
    to: readonly string[];
    subject: string;
    text: string;
    receivedAt: string;
  }): Promise<void> {
    const inboundId = stableHash({
      namespace: "dueback/inbound-envelope/v1",
      providerEventId: input.providerEventId,
      providerEmailId: input.providerEmailId
    });
    await this.db.collection("inboundEnvelopes").doc(inboundId.slice(7, 39)).set({
      inboundId: `inbound_${inboundId.slice(7, 31)}`,
      providerEventId: input.providerEventId,
      providerEmailId: input.providerEmailId,
      channelType: "MANAGED_EMAIL",
      correlationStatus: "UNKNOWN",
      senderFingerprint: stableHash(input.from.toLowerCase()),
      recipientRouteFingerprints: input.to.map((recipient) => stableHash(recipient.toLowerCase())),
      subject: input.subject,
      text: input.text,
      contentHash: stableHash(input.text),
      providerSignatureValid: true,
      receivedAt: input.receivedAt,
      deleteAt: firestoreDeleteAt(input.receivedAt, 86_400_000)
    });
  }

  async reserveCallback(
    dedupeKey: string,
    receivedAt: string
  ): Promise<"RESERVED" | "IN_FLIGHT" | "COMPLETED"> {
    const reference = this.db.collection("callbackDedupe").doc(dedupeKey.slice(7));
    return this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (current.exists) return current.get("status") === "COMPLETED" ? "COMPLETED" : "IN_FLIGHT";
      transaction.create(reference, {
        receivedAt,
        status: "IN_FLIGHT",
        deleteAt: firestoreDeleteAt(receivedAt)
      });
      return "RESERVED";
    });
  }

  async completeCallback(dedupeKey: string): Promise<void> {
    await this.db
      .collection("callbackDedupe")
      .doc(dedupeKey.slice(7))
      .update({ status: "COMPLETED" });
  }

  async failCallback(dedupeKey: string): Promise<void> {
    await this.db.collection("callbackDedupe").doc(dedupeKey.slice(7)).delete();
  }
}
