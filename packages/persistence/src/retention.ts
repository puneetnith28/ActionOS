import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { stableHash } from "@dueback/domain";
import type { CaseControlStore, DeletionReceipt } from "@dueback/runtime/case-control";
import type { FollowThroughCase } from "@dueback/runtime/case-runner";
import { firestoreDeleteAt } from "./expiry";
import type { WakeIntent } from "@dueback/runtime/wake-outbox";
import { persistWakeIntent } from "./wake-outbox-store";

export class FirestoreCaseControlStore implements CaseControlStore {
  constructor(private readonly db: Firestore) {}

  private commandReference(idempotencyKey: string) {
    return this.db.collection("caseControlCommands").doc(stableHash(idempotencyKey).slice(7, 39));
  }

  async getCommandResult(input: {
    idempotencyKey: string;
    caseId: string;
    ownerId: string;
    action: import("@dueback/runtime/case-control").CaseControlAction;
  }): Promise<FollowThroughCase | DeletionReceipt | undefined> {
    const document = await this.commandReference(input.idempotencyKey).get();
    if (!document.exists) return undefined;
    if (document.get("caseId") !== input.caseId || document.get("ownerId") !== input.ownerId || document.get("action") !== input.action)
      throw new Error("IDEMPOTENCY_KEY_REUSED");
    return document.get("result") as FollowThroughCase | DeletionReceipt;
  }

  async get(caseId: string): Promise<FollowThroughCase | undefined> {
    const document = await this.db.collection("caseRuns").doc(caseId).get();
    return document.exists ? (document.data() as FollowThroughCase) : undefined;
  }

  async transition(input: {
    caseId: string;
    ownerId: string;
    expectedVersion: number;
    action: "STOP" | "REVOKE" | "EXPIRE" | "REOPEN" | "RESUME";
    reason: string;
    now: string;
    idempotencyKey: string;
    wake?: WakeIntent;
  }): Promise<FollowThroughCase> {
    const reference = this.db.collection("caseRuns").doc(input.caseId);
    const commandRef = this.commandReference(input.idempotencyKey);
    return this.db.runTransaction(async (transaction) => {
      const [snapshot, prior] = await Promise.all([transaction.get(reference), transaction.get(commandRef)]);
      if (prior.exists) {
        if (prior.get("caseId") !== input.caseId || prior.get("ownerId") !== input.ownerId || prior.get("action") !== input.action)
          throw new Error("IDEMPOTENCY_KEY_REUSED");
        return prior.get("result") as FollowThroughCase;
      }
      if (!snapshot.exists) throw new Error("CASE_NOT_FOUND");
      const current = snapshot.data() as FollowThroughCase;
      if (current.ownerId !== input.ownerId) throw new Error("CASE_OWNERSHIP_REQUIRED");
      if (current.version !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
      const state =
        input.action === "REOPEN"
          ? ("NEEDS_ATTENTION" as const)
          : input.action === "RESUME"
            ? ("READY" as const)
            : input.action === "EXPIRE"
              ? ("EXPIRED" as const)
              : ("CANCELLED" as const);
      const next: FollowThroughCase = {
        ...current,
        state,
        version: current.version + 1,
        controlReason: input.reason,
        controlledAt: input.now,
        updatedAt: input.now,
        ...(input.action === "RESUME" ? { nextWakeAt: input.now } : {}),
        ...(["REOPEN", "RESUME"].includes(input.action)
          ? {}
          : { approval: { ...current.approval, revokedAt: input.now } })
      };
      transaction.set(reference, {
        ...next,
        ...(input.action === "EXPIRE" ? { deleteAt: firestoreDeleteAt(input.now) } : {})
      });
      persistWakeIntent(transaction, this.db, input.wake);
      transaction.create(commandRef, {
        idempotencyKeyHash: stableHash(input.idempotencyKey), caseId: input.caseId,
        ownerId: input.ownerId, action: input.action, result: next,
        createdAt: input.now, deleteAt: firestoreDeleteAt(input.now)
      });
      transaction.create(reference.collection("events").doc(`control-${String(next.version)}`), {
        eventId: `control-${String(next.version)}`,
        caseId: input.caseId,
        sequence: next.version,
        type: "CASE_CONTROL",
        actor: "PERSON",
        reasonCodes: [input.reason],
        occurredAt: input.now,
        correlationId: current.correlationId ?? "corr_unavailable",
        state,
        deleteAt: firestoreDeleteAt(input.now)
      });
      return next;
    });
  }

  async beginReapproval(input: {
    caseId: string;
    ownerId: string;
    expectedVersion: number;
    reason: string;
    now: string;
    idempotencyKey: string;
  }): Promise<FollowThroughCase> {
    const runRef = this.db.collection("caseRuns").doc(input.caseId);
    const draftRef = this.db.collection("caseDrafts").doc(input.caseId);
    const commandRef = this.commandReference(input.idempotencyKey);
    return this.db.runTransaction(async (transaction) => {
      const [runSnapshot, draftSnapshot, prior] = await Promise.all([
        transaction.get(runRef), transaction.get(draftRef), transaction.get(commandRef)
      ]);
      if (prior.exists) {
        if (prior.get("caseId") !== input.caseId || prior.get("ownerId") !== input.ownerId || prior.get("action") !== "REVISE")
          throw new Error("IDEMPOTENCY_KEY_REUSED");
        return prior.get("result") as FollowThroughCase;
      }
      if (!runSnapshot.exists || !draftSnapshot.exists) throw new Error("CASE_NOT_FOUND");
      const current = runSnapshot.data() as FollowThroughCase;
      if (current.ownerId !== input.ownerId || draftSnapshot.get("ownerId") !== input.ownerId)
        throw new Error("CASE_OWNERSHIP_REQUIRED");
      if (current.version !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
      const next: FollowThroughCase = {
        ...current,
        state: "CANCELLED",
        version: current.version + 1,
        approval: { ...current.approval, revokedAt: input.now },
        controlReason: input.reason,
        controlledAt: input.now,
        updatedAt: input.now
      };
      transaction.set(runRef, next);
      transaction.update(draftRef, {
        state: "AWAITING_APPROVAL",
        approval: FieldValue.delete()
      });
      transaction.create(commandRef, {
        idempotencyKeyHash: stableHash(input.idempotencyKey), caseId: input.caseId,
        ownerId: input.ownerId, action: "REVISE", result: next,
        createdAt: input.now, deleteAt: firestoreDeleteAt(input.now)
      });
      const eventId = `control-${String(next.version)}`;
      transaction.create(runRef.collection("events").doc(eventId), {
        eventId,
        caseId: input.caseId,
        sequence: next.version,
        type: "AUTHORITY_REVISION_REQUESTED",
        actor: "PERSON",
        reasonCodes: [input.reason],
        occurredAt: input.now,
        correlationId: current.correlationId ?? "corr_unavailable",
        state: next.state,
        deleteAt: firestoreDeleteAt(input.now)
      });
      return next;
    });
  }

  async requestDeletion(input: {
    caseId: string;
    ownerId: string;
    expectedVersion: number;
    now: string;
    idempotencyKey: string;
  }): Promise<DeletionReceipt> {
    const runRef = this.db.collection("caseRuns").doc(input.caseId);
    const draftRef = this.db.collection("caseDrafts").doc(input.caseId);
    const tombstoneId = stableHash({
      namespace: "dueback/deletion/v1",
      caseId: input.caseId
    }).slice(7, 39);
    const tombstoneRef = this.db.collection("deletionTombstones").doc(tombstoneId);
    const commandRef = this.commandReference(input.idempotencyKey);
    const receipt: DeletionReceipt = {
      caseId: input.caseId,
      status: "DELETION_ACCEPTED",
      requestedAt: input.now,
      tombstoneId
    };
    await this.db.runTransaction(async (transaction) => {
      const [run, prior] = await Promise.all([transaction.get(runRef), transaction.get(commandRef)]);
      if (prior.exists) return;
      if (!run.exists) throw new Error("CASE_NOT_FOUND");
      const current = run.data() as FollowThroughCase;
      if (current.ownerId !== input.ownerId) throw new Error("CASE_OWNERSHIP_REQUIRED");
      if (current.version !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
      transaction.create(tombstoneRef, {
        caseHash: stableHash(input.caseId),
        ownerHash: stableHash(input.ownerId),
        reason: "USER_REQUESTED_DELETION",
        requestedAt: input.now,
        purgeAfter: new Date(Date.parse(input.now) + 30 * 86_400_000).toISOString(),
        deleteAt: firestoreDeleteAt(input.now)
      });
      transaction.create(commandRef, {
        idempotencyKeyHash: stableHash(input.idempotencyKey), caseId: input.caseId,
        ownerId: input.ownerId, action: "DELETE", result: receipt,
        createdAt: input.now, deleteAt: firestoreDeleteAt(input.now)
      });
      transaction.delete(runRef);
      transaction.delete(draftRef);
    });

    const [notifications, dedupe] = await Promise.all([
      this.db.collection("notifications").where("caseId", "==", input.caseId).get(),
      this.db.collection("intakeDedupe").where("caseId", "==", input.caseId).get()
    ]);
    const cleanup = this.db.batch();
    for (const document of [...notifications.docs, ...dedupe.docs]) cleanup.delete(document.ref);
    await cleanup.commit();
    await this.db.recursiveDelete(runRef);
    return receipt;
  }
}
