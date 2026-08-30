import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { stableHash } from "@actionos/domain";
import type { MissionControlStore, DeletionReceipt } from "@actionos/runtime/mission-control";
import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import { firestoreDeleteAt } from "./expiry";
import type { WakeIntent } from "@actionos/runtime/wake-outbox";
import { persistWakeIntent } from "./wake-outbox-store";

export class FirestoreMissionControlStore implements MissionControlStore {
  constructor(private readonly db: Firestore) {}

  private commandReference(idempotencyKey: string) {
    return this.db.collection("missionControlCommands").doc(stableHash(idempotencyKey).slice(7, 39));
  }

  async getCommandResult(input: {
    idempotencyKey: string;
    missionId: string;
    ownerId: string;
    action: import("@actionos/runtime/mission-control").MissionControlAction;
  }): Promise<FollowThroughMission | DeletionReceipt | undefined> {
    const document = await this.commandReference(input.idempotencyKey).get();
    if (!document.exists) return undefined;
    if (document.get("missionId") !== input.missionId || document.get("ownerId") !== input.ownerId || document.get("action") !== input.action)
      throw new Error("IDEMPOTENCY_KEY_REUSED");
    return document.get("result") as FollowThroughMission | DeletionReceipt;
  }

  async get(missionId: string): Promise<FollowThroughMission | undefined> {
    const document = await this.db.collection("missionRuns").doc(missionId).get();
    return document.exists ? (document.data() as FollowThroughMission) : undefined;
  }

  async transition(input: {
    missionId: string;
    ownerId: string;
    expectedVersion: number;
    action: "STOP" | "REVOKE" | "EXPIRE" | "REOPEN" | "RESUME";
    reason: string;
    now: string;
    idempotencyKey: string;
    wake?: WakeIntent;
  }): Promise<FollowThroughMission> {
    const reference = this.db.collection("missionRuns").doc(input.missionId);
    const commandRef = this.commandReference(input.idempotencyKey);
    const openInterventionsQuery = this.db.collection("interventions").where("missionId", "==", input.missionId).where("status", "==", "OPEN");
    return this.db.runTransaction(async (transaction) => {
      const [snapshot, prior, interventionsSnapshot] = await Promise.all([
        transaction.get(reference),
        transaction.get(commandRef),
        transaction.get(openInterventionsQuery)
      ]);
      if (prior.exists) {
        if (prior.get("missionId") !== input.missionId || prior.get("ownerId") !== input.ownerId || prior.get("action") !== input.action)
          throw new Error("IDEMPOTENCY_KEY_REUSED");
        return prior.get("result") as FollowThroughMission;
      }
      if (!snapshot.exists) throw new Error("MISSION_NOT_FOUND");
      const current = snapshot.data() as FollowThroughMission;
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
      const next: FollowThroughMission = {
        ...current,
        state,
        version: current.version + 1,
        controlReason: input.reason,
        controlledAt: input.now,
        updatedAt: input.now,
        ...(input.action === "RESUME" ? { nextWakeAt: input.now } : {}),
        ...(["REOPEN", "RESUME"].includes(input.action)
          ? {}
          : { boundary: { ...current.boundary, revokedAt: input.now } })
      };
      transaction.set(reference, {
        ...next,
        ...(input.action === "EXPIRE" ? { deleteAt: firestoreDeleteAt(input.now) } : {})
      });
      persistWakeIntent(transaction, this.db, input.wake);
      transaction.create(commandRef, {
        idempotencyKeyHash: stableHash(input.idempotencyKey), missionId: input.missionId,
        ownerId: input.ownerId, action: input.action, result: next,
        createdAt: input.now, deleteAt: firestoreDeleteAt(input.now)
      });
      transaction.create(reference.collection("events").doc(`control-${String(next.version)}`), {
        eventId: `control-${String(next.version)}`,
        missionId: input.missionId,
        sequence: next.version,
        type: "MISSION_CONTROL",
        actor: "PERSON",
        reasonCodes: [input.reason],
        occurredAt: input.now,
        correlationId: current.correlationId ?? "corr_unavailable",
        state,
        deleteAt: firestoreDeleteAt(input.now)
      });
      for (const doc of interventionsSnapshot.docs) {
        transaction.update(doc.ref, { status: "RESOLVED" });
      }
      return next;
    });
  }

  async beginReapproval(input: {
    missionId: string;
    ownerId: string;
    expectedVersion: number;
    reason: string;
    now: string;
    idempotencyKey: string;
  }): Promise<FollowThroughMission> {
    const runRef = this.db.collection("missionRuns").doc(input.missionId);
    const draftRef = this.db.collection("missionDrafts").doc(input.missionId);
    const commandRef = this.commandReference(input.idempotencyKey);
    const openInterventionsQuery = this.db.collection("interventions").where("missionId", "==", input.missionId).where("status", "==", "OPEN");
    return this.db.runTransaction(async (transaction) => {
      const [runSnapshot, draftSnapshot, prior, interventionsSnapshot] = await Promise.all([
        transaction.get(runRef),
        transaction.get(draftRef),
        transaction.get(commandRef),
        transaction.get(openInterventionsQuery)
      ]);
      if (prior.exists) {
        if (prior.get("missionId") !== input.missionId || prior.get("ownerId") !== input.ownerId || prior.get("action") !== "REVISE")
          throw new Error("IDEMPOTENCY_KEY_REUSED");
        return prior.get("result") as FollowThroughMission;
      }
      if (!runSnapshot.exists || !draftSnapshot.exists) throw new Error("MISSION_NOT_FOUND");
      const current = runSnapshot.data() as FollowThroughMission;
      if (current.ownerId !== input.ownerId || draftSnapshot.get("ownerId") !== input.ownerId)
        throw new Error("CASE_OWNERSHIP_REQUIRED");
      if (current.version !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
      const next: FollowThroughMission = {
        ...current,
        state: "CANCELLED",
        version: current.version + 1,
        boundary: { ...current.boundary, revokedAt: input.now },
        controlReason: input.reason,
        controlledAt: input.now,
        updatedAt: input.now
      };
      transaction.set(runRef, next);
      transaction.update(draftRef, {
        state: "AWAITING_APPROVAL",
        boundary: FieldValue.delete()
      });
      transaction.create(commandRef, {
        idempotencyKeyHash: stableHash(input.idempotencyKey), missionId: input.missionId,
        ownerId: input.ownerId, action: "REVISE", result: next,
        createdAt: input.now, deleteAt: firestoreDeleteAt(input.now)
      });
      const eventId = `control-${String(next.version)}`;
      transaction.create(runRef.collection("events").doc(eventId), {
        eventId,
        missionId: input.missionId,
        sequence: next.version,
        type: "AUTHORITY_REVISION_REQUESTED",
        actor: "PERSON",
        reasonCodes: [input.reason],
        occurredAt: input.now,
        correlationId: current.correlationId ?? "corr_unavailable",
        state: next.state,
        deleteAt: firestoreDeleteAt(input.now)
      });
      for (const doc of interventionsSnapshot.docs) {
        transaction.update(doc.ref, { status: "RESOLVED" });
      }
      return next;
    });
  }

  async requestDeletion(input: {
    missionId: string;
    ownerId: string;
    expectedVersion: number;
    now: string;
    idempotencyKey: string;
  }): Promise<DeletionReceipt> {
    const runRef = this.db.collection("missionRuns").doc(input.missionId);
    const draftRef = this.db.collection("missionDrafts").doc(input.missionId);
    const tombstoneId = stableHash({
      namespace: "actionos/deletion/v1",
      missionId: input.missionId
    }).slice(7, 39);
    const tombstoneRef = this.db.collection("deletionTombstones").doc(tombstoneId);
    const commandRef = this.commandReference(input.idempotencyKey);
    const receipt: DeletionReceipt = {
      missionId: input.missionId,
      status: "DELETION_ACCEPTED",
      requestedAt: input.now,
      tombstoneId
    };
    await this.db.runTransaction(async (transaction) => {
      const [run, prior] = await Promise.all([transaction.get(runRef), transaction.get(commandRef)]);
      if (prior.exists) return;
      if (!run.exists) throw new Error("MISSION_NOT_FOUND");
      const current = run.data() as FollowThroughMission;
      if (current.ownerId !== input.ownerId) throw new Error("CASE_OWNERSHIP_REQUIRED");
      if (current.version !== input.expectedVersion) throw new Error("VERSION_CONFLICT");
      transaction.create(tombstoneRef, {
        caseHash: stableHash(input.missionId),
        ownerHash: stableHash(input.ownerId),
        reason: "USER_REQUESTED_DELETION",
        requestedAt: input.now,
        purgeAfter: new Date(Date.parse(input.now) + 30 * 86_400_000).toISOString(),
        deleteAt: firestoreDeleteAt(input.now)
      });
      transaction.create(commandRef, {
        idempotencyKeyHash: stableHash(input.idempotencyKey), missionId: input.missionId,
        ownerId: input.ownerId, action: "DELETE", result: receipt,
        createdAt: input.now, deleteAt: firestoreDeleteAt(input.now)
      });
      transaction.delete(runRef);
      transaction.delete(draftRef);
    });

    const [notifications, dedupe] = await Promise.all([
      this.db.collection("notifications").where("missionId", "==", input.missionId).get(),
      this.db.collection("intakeDedupe").where("missionId", "==", input.missionId).get()
    ]);
    const cleanup = this.db.batch();
    for (const document of [...notifications.docs, ...dedupe.docs]) cleanup.delete(document.ref);
    await cleanup.commit();
    await this.db.recursiveDelete(runRef);
    return receipt;
  }
}
