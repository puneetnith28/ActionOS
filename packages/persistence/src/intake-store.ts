import type { Firestore } from "firebase-admin/firestore";
import type { DraftCase, IntakeStore } from "@dueback/runtime/intake-service";
import type { PlanStore } from "@dueback/runtime/plan-service";
import { stableHash } from "@dueback/domain";
import { firestoreDeleteAt } from "./expiry";
import type { WakeIntent } from "@dueback/runtime/wake-outbox";
import { persistWakeIntent } from "./wake-outbox-store";

export function firstRunDueAt(draft: DraftCase): string {
  return draft.plan.followUpAt ?? draft.promiseDraft.dueAt?.value ??
    new Date(Date.parse(draft.createdAt) + 1000).toISOString();
}

export class FirestoreIntakeStore implements IntakeStore, PlanStore {
  constructor(private readonly db: Firestore) {}

  async findByDedupeKey(ownerId: string, dedupeKey: string): Promise<DraftCase | undefined> {
    const document = await this.db.collection("intakeDedupe").doc(dedupeKey.slice(7)).get();
    if (!document.exists || document.get("ownerId") !== ownerId) return undefined;
    const caseId = document.get("caseId") as string;
    const draftDocument = await this.db.collection("caseDrafts").doc(caseId).get();
    return draftDocument.exists ? (draftDocument.data() as DraftCase) : undefined;
  }

  async createDraft(draft: DraftCase): Promise<void> {
    const dedupeRef = this.db.collection("intakeDedupe").doc(draft.dedupeKey.slice(7));
    const draftRef = this.db.collection("caseDrafts").doc(draft.caseId);
    await this.db.runTransaction(async (transaction) => {
      const existing = await transaction.get(dedupeRef);
      if (existing.exists) throw new Error("DUPLICATE_INTAKE_RACE");
      const deleteAt = firestoreDeleteAt(draft.plan.expiresAt);
      transaction.create(draftRef, { ...draft, deleteAt });
      transaction.create(dedupeRef, {
        ownerId: draft.ownerId,
        caseId: draft.caseId,
        createdAt: draft.createdAt,
        deleteAt
      });
    });
  }

  async get(caseId: string): Promise<DraftCase | undefined> {
    const document = await this.db.collection("caseDrafts").doc(caseId).get();
    return document.exists ? (document.data() as DraftCase) : undefined;
  }

  async deleteDraft(caseId: string, ownerId: string): Promise<void> {
    const draftRef = this.db.collection("caseDrafts").doc(caseId);
    await this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(draftRef);
      if (!current.exists) return;
      const draft = current.data() as DraftCase;
      if (draft.ownerId !== ownerId) throw new Error("CASE_OWNERSHIP_REQUIRED");
      transaction.delete(draftRef);
      transaction.delete(this.db.collection("intakeDedupe").doc(draft.dedupeKey.slice(7)));
    });
  }

  async replace(
    caseId: string,
    expectedPlanVersion: number,
    next: DraftCase,
    wake?: WakeIntent
  ): Promise<void> {
    const reference = this.db.collection("caseDrafts").doc(caseId);
    const runReference = this.db.collection("caseRuns").doc(caseId);
    await this.db.runTransaction(async (transaction) => {
      const current = await transaction.get(reference);
      if (!current.exists) throw new Error("CASE_NOT_FOUND");
      const currentDraft = current.data() as DraftCase;
      if (currentDraft.plan.version !== expectedPlanVersion) throw new Error("STALE_PLAN_VERSION");
      transaction.set(reference, next);
      persistWakeIntent(transaction, this.db, wake);
      if (next.state === "READY" && next.approval) {
        const correlationId = `corr_${stableHash({
          namespace: "dueback/correlation/v1",
          caseId: next.caseId
        }).slice(7, 31)}`;
        transaction.set(runReference, {
          caseId: next.caseId,
          ownerId: next.ownerId,
          state: "READY",
          version: 1,
          plan: next.plan,
          approval: next.approval,
          actionOrdinal: 1,
          correlationId,
          dueAt: firstRunDueAt(next),
          updatedAt: next.approval.approvedAt,
          deleteAt: firestoreDeleteAt(next.plan.expiresAt)
        });
        transaction.create(runReference.collection("events").doc("000001-plan-approved"), {
          eventId: "000001-plan-approved",
          caseId: next.caseId,
          sequence: 1,
          type: "PLAN_APPROVED",
          actor: "PERSON",
          occurredAt: next.approval.approvedAt,
          reasonCodes: ["CURRENT_PLAN_VERSION_APPROVED"],
          correlationId,
          state: "READY",
          deleteAt: firestoreDeleteAt(next.plan.expiresAt)
        });
      }
    });
  }
}
