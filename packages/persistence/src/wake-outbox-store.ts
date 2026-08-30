import { FieldValue, type Firestore, type Transaction } from "firebase-admin/firestore";
import type { WakeIntent, WakeOutboxStore } from "@actionos/runtime/wake-outbox";
import { firestoreDeleteAt } from "./expiry";

export function persistWakeIntent(
  transaction: Transaction,
  db: Firestore,
  intent: WakeIntent | undefined
): void {
  if (!intent) return;
  transaction.set(db.collection("wakeIntents").doc(intent.intentId), {
    ...intent,
    deleteAt: firestoreDeleteAt(intent.createdAt)
  }, { merge: true });
}

export class FirestoreWakeOutboxStore implements WakeOutboxStore {
  constructor(private readonly db: Firestore) {}

  async listPending(limit: number): Promise<readonly WakeIntent[]> {
    const snapshot = await this.db.collection("wakeIntents")
      .where("status", "==", "PENDING")
      .limit(Math.min(Math.max(limit, 1), 100))
      .get();
    return snapshot.docs.map((document) => document.data() as WakeIntent);
  }

  async markDispatched(intentId: string, taskName: string, observedAt: string): Promise<void> {
    await this.db.collection("wakeIntents").doc(intentId).set({
      status: "DISPATCHED",
      taskName,
      updatedAt: observedAt,
      attemptCount: FieldValue.increment(1),
      lastError: FieldValue.delete()
    }, { merge: true });
  }

  async markFailed(intentId: string, reason: string, observedAt: string): Promise<void> {
    await this.db.collection("wakeIntents").doc(intentId).set({
      status: "PENDING",
      updatedAt: observedAt,
      attemptCount: FieldValue.increment(1),
      lastError: /^[A-Z0-9_:,-]{1,120}$/.test(reason) ? reason : "WAKE_DISPATCH_FAILED"
    }, { merge: true });
  }
}
