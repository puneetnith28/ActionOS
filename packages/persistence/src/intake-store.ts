import type { Firestore } from "firebase-admin/firestore";
import type { DraftMission, IntakeStore } from "@actionos/runtime/intake-service";
import type { PlanStore } from "@actionos/runtime/plan-service";
import { stableHash } from "@actionos/domain";
import { firestoreDeleteAt } from "./expiry";
import type { WakeIntent } from "@actionos/runtime/wake-outbox";
import { persistWakeIntent } from "./wake-outbox-store";

export function firstRunDueAt(draft: DraftMission): string {
  return draft.plan.followUpAt ?? draft.promiseDraft.dueAt?.value ??
    new Date(Date.parse(draft.createdAt) + 1000).toISOString();
}

export class FirestoreIntakeStore implements IntakeStore, PlanStore {
  constructor(private readonly db: Firestore) {}

  async findByDedupeKey(ownerId: string, dedupeKey: string): Promise<DraftMission | undefined> {
    const document = await this.db.collection("intakeDedupe").doc(dedupeKey.slice(7)).get();
    if (!document.exists || document.get("ownerId") !== ownerId) return undefined;
    const missionId = document.get("missionId") as string;
    const draftDocument = await this.db.collection("missionDrafts").doc(missionId).get();
    return draftDocument.exists ? (draftDocument.data() as DraftMission) : undefined;
  }

  async createDraft(draft: DraftMission): Promise<void> {
    const dedupeRef = this.db.collection("intakeDedupe").doc(draft.dedupeKey.slice(7));
    const draftRef = this.db.collection("missionDrafts").doc(draft.missionId);
    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(dedupeRef);
      if (existing.exists) throw new Error("DUPLICATE_INTAKE_RACE");
      const deleteAt = firestoreDeleteAt(draft.plan.expiresAt);
      transaction.create(draftRef, { ...draft, deleteAt });
      transaction.create(dedupeRef, {
        ownerId: draft.ownerId,
        missionId: draft.missionId,
        createdAt: draft.createdAt,
        deleteAt
      });
    });
  }

  async get(missionId: string): Promise<DraftMission | undefined> {
    const document = await this.db.collection("missionDrafts").doc(missionId).get();
    return document.exists ? (document.data() as DraftMission) : undefined;
  }

  async deleteDraft(missionId: string, ownerId: string): Promise<void> {
    const draftRef = this.db.collection("missionDrafts").doc(missionId);
    await this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(draftRef);
      if (!current.exists) return;
      const draft = current.data() as DraftMission;
      if (draft.ownerId !== ownerId) throw new Error("CASE_OWNERSHIP_REQUIRED");
      transaction.delete(draftRef);
      transaction.delete(this.db.collection("intakeDedupe").doc(draft.dedupeKey.slice(7)));
    });
  }

  async replace(
    missionId: string,
    expectedPlanVersion: number,
    next: DraftMission,
    wake?: WakeIntent
  ): Promise<void> {
    const reference = this.db.collection("missionDrafts").doc(missionId);
    const runReference = this.db.collection("missionRuns").doc(missionId);
    await this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (!current.exists) throw new Error("MISSION_NOT_FOUND");
      const currentDraft = current.data() as DraftMission;
      if (currentDraft.plan.version !== expectedPlanVersion) throw new Error("STALE_PLAN_VERSION");
      transaction.set(reference, next);
      persistWakeIntent(transaction, this.db, wake);
      if (next.state === "READY" && next.boundary) {
        const correlationId = `corr_${stableHash({
          namespace: "actionos/correlation/v1",
          missionId: next.missionId
        }).slice(7, 31)}`;
        transaction.set(runReference, {
          missionId: next.missionId,
          ownerId: next.ownerId,
          state: "READY",
          version: 1,
          plan: next.plan,
          boundary: next.boundary,
          actionOrdinal: 1,
          correlationId,
          dueAt: firstRunDueAt(next),
          updatedAt: next.boundary.approvedAt,
          deleteAt: firestoreDeleteAt(next.plan.expiresAt)
        });
        transaction.create(runReference.collection("events").doc("000001-plan-approved"), {
          eventId: "000001-plan-approved",
          missionId: next.missionId,
          sequence: 1,
          type: "PLAN_APPROVED",
          actor: "PERSON",
          occurredAt: next.boundary.approvedAt,
          reasonCodes: ["CURRENT_PLAN_VERSION_APPROVED"],
          correlationId,
          state: "READY",
          deleteAt: firestoreDeleteAt(next.plan.expiresAt)
        });
      }
    });
  }
}
