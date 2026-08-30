import type { Firestore } from "firebase-admin/firestore";
import { DomainTransitionError, reduceMission } from "@actionos/domain";
import type { MissionSnapshot, DomainEvent, TransitionCommand } from "@actionos/domain";
import { firestoreDeleteAt } from "./expiry";

export interface PersistedEvent extends DomainEvent {
  readonly eventId: string;
  readonly sequence: number;
  readonly occurredAt: string;
  readonly correlationId: string;
  readonly schemaVersion: 1;
}

export class FirestoreCaseRepository {
  constructor(private readonly db: Firestore) {}

  async create(snapshot: MissionSnapshot): Promise<void> {
    await this.db.collection("cases").doc(snapshot.missionId).create(snapshot);
  }

  async get(missionId: string): Promise<MissionSnapshot | undefined> {
    const document = await this.db.collection("cases").doc(missionId).get();
    return document.exists ? (document.data() as MissionSnapshot) : undefined;
  }

  async transition(input: {
    readonly missionId: string;
    readonly eventId: string;
    readonly correlationId: string;
    readonly occurredAt: string;
    readonly command: TransitionCommand;
  }): Promise<{ snapshot: MissionSnapshot; event: PersistedEvent; duplicate: boolean }> {
    const caseRef = this.db.collection("cases").doc(input.missionId);
    const eventRef = caseRef.collection("events").doc(input.eventId);

    return this.db.runTransaction(async (transaction) => {
      const [caseDocument, existingEvent] = await Promise.all([
        transaction.get(caseRef),
        transaction.get(eventRef)
      ]);
      if (!caseDocument.exists) throw new Error(`Case ${input.missionId} does not exist`);

      const current = caseDocument.data() as MissionSnapshot;
      if (existingEvent.exists) {
        return {
          snapshot: current,
          event: existingEvent.data() as PersistedEvent,
          duplicate: true
        };
      }

      if (current.version !== input.command.expectedVersion) {
        throw new DomainTransitionError("Case version changed", "VERSION_CONFLICT");
      }

      const reduced = reduceMission(current, input.command);
      const event: PersistedEvent = {
        ...reduced.event,
        eventId: input.eventId,
        sequence: reduced.snapshot.version,
        occurredAt: input.occurredAt,
        correlationId: input.correlationId,
        schemaVersion: 1
      };
      transaction.update(caseRef, reduced.snapshot);
      transaction.create(eventRef, { ...event, deleteAt: firestoreDeleteAt(input.occurredAt) });
      return { snapshot: reduced.snapshot, event, duplicate: false };
    });
  }
}
