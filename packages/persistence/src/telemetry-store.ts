import type { Firestore } from "firebase-admin/firestore";
import type { ExecutionTelemetry, TelemetryStore } from "@actionos/observability";
import { stableHash } from "@actionos/domain";
import { firestoreDeleteAt } from "./expiry";

export class FirestoreTelemetryStore implements TelemetryStore {
  constructor(private readonly db: Firestore) {}

  async recordTelemetry(telemetry: ExecutionTelemetry): Promise<void> {
    const id = stableHash(`${telemetry.missionId}:${telemetry.correlationId}:${telemetry.occurredAt}:${telemetry.kind}`);
    await this.db
      .collection("missionRuns")
      .doc(telemetry.missionId)
      .collection("telemetry")
      .doc(id.slice(7, 39))
      .set({
        ...telemetry,
        deleteAt: firestoreDeleteAt(telemetry.occurredAt, 30 * 86_400_000)
      });
  }

  async listTelemetry(missionId: string, limitCount = 100): Promise<readonly ExecutionTelemetry[]> {
    const snapshot = await this.db
      .collection("missionRuns")
      .doc(missionId)
      .collection("telemetry")
      .orderBy("occurredAt", "desc")
      .limit(limitCount)
      .get();
    return snapshot.docs.map((doc) => doc.data() as ExecutionTelemetry);
  }

  async listAllTelemetry(limitCount = 100): Promise<readonly ExecutionTelemetry[]> {
    const snapshot = await this.db
      .collectionGroup("telemetry")
      .orderBy("occurredAt", "desc")
      .limit(limitCount)
      .get();
    return snapshot.docs.map((doc) => doc.data() as ExecutionTelemetry);
  }
}
