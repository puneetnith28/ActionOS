import type { Firestore } from "firebase-admin/firestore";
import { DomainTransitionError, reduceCase } from "@dueback/domain";
import type { CaseSnapshot, DomainEvent, TransitionCommand } from "@dueback/domain";
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

  async create(snapshot: CaseSnapshot): Promise<void> {
    await this.db.collection("cases").doc(snapshot.caseId).create(snapshot);
  }

  async get(caseId: string): Promise<CaseSnapshot | undefined> {
    const document = await this.db.collection("cases").doc(caseId).get();
    return document.exists ? (document.data() as CaseSnapshot) : undefined;
  }

  async transition(input: {
    readonly caseId: string;
    readonly eventId: string;
    readonly correlationId: string;
    readonly occurredAt: string;
    readonly command: TransitionCommand;
  }): Promise<{ snapshot: CaseSnapshot; event: PersistedEvent; duplicate: boolean }> {
    const caseRef = this.db.collection("cases").doc(input.caseId);
    const eventRef = caseRef.collection("events").doc(input.eventId);

    return this.db.runTransaction(async (transaction) => {
      const [caseDocument, existingEvent] = await Promise.all([
        transaction.get(caseRef),
        transaction.get(eventRef)
      ]);
      if (!caseDocument.exists) throw new Error(`Case ${input.caseId} does not exist`);

      const current = caseDocument.data() as CaseSnapshot;
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

      const reduced = reduceCase(current, input.command);
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
