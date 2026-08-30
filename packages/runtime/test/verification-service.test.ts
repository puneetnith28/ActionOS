import { describe, expect, it } from "vitest";
import type { ExecutionOutcomeContract } from "@actionos/contracts";
import {
  VerificationService,
  type EvidenceMission,
  type EvidenceMissionStore,
  type EvidenceRecord
} from "../src/verification-service";
import type { NotificationRecord, NotificationStore } from "../src/notifications";
import { makeDraft } from "./support";

class Cases implements EvidenceMissionStore {
  records: EvidenceRecord[] = [];
  constructor(public item: EvidenceMission) {}
  get(): Promise<EvidenceMission> {
    return Promise.resolve(this.item);
  }
  record(input: {
    missionId: string;
    expectedVersion: number;
    nextState: EvidenceMission["state"];
    nextWakeAt?: string;
    verification: EvidenceRecord;
  }): Promise<{ duplicate: boolean }> {
    this.records.push(input.evidence);
    this.item = {
      ...this.item,
      state: input.nextState,
      version: this.item.version + 1,
      ...(input.nextWakeAt ? { nextWakeAt: input.nextWakeAt } : {})
    };
    return Promise.resolve({ duplicate: false });
  }
}

class Notifications implements NotificationStore {
  records = new Map<string, NotificationRecord>();
  createIfAbsent(
    record: NotificationRecord
  ): Promise<{ record: NotificationRecord; duplicate: boolean }> {
    const old = this.records.get(record.dedupeKey);
    if (old) return Promise.resolve({ record: old, duplicate: true });
    this.records.set(record.dedupeKey, record);
    return Promise.resolve({ record, duplicate: false });
  }
}

function candidate(status: ExecutionOutcomeContract["status"]): ExecutionOutcomeContract {
  return {
    outcomeId: `evidence_${status}`,
    missionId: "mission_12345678",
    status,
    amountMinor: 7900,
    currency: "USD",
    transactionRef: "ORDER-79",
    issuedAt: "2026-08-15T12:00:00.000Z",
    issuer: "merchant-sandbox",
    signatureValid: true
  };
}

describe("VerificationService", () => {
  it("keeps acknowledgement open and creates no completion notification", async () => {
    const draft = makeDraft();
    const cases = new Cases({
      missionId: draft.missionId,
      ownerId: draft.ownerId,
      state: "WAITING_EXTERNAL",
      version: 2,
      plan: draft.plan
    });
    const notifications = new Notifications();
    const scheduled: Array<{
      missionId: string;
      expectedVersion: number;
      wakeAt: string;
      correlationId?: string;
    }> = [];
    const scheduleMission = (input: typeof scheduled[number]): Promise<unknown> => {
      scheduled.push(input);
      return Promise.resolve({});
    };
    const result = await new VerificationService(
      cases,
      notifications,
      undefined,
      undefined,
      { scheduleMission }
    ).verifyOutcome(
      candidate("ACTION_ATTEMPTED"),
      "2026-08-15T12:00:05.000Z"
    );
    expect(result.status).toBe("INSUFFICIENT");
    expect(cases.item.state).toBe("WAITING_EXTERNAL");
    expect(cases.item.nextWakeAt).toBe("2026-08-17T12:00:05.000Z");
    expect(scheduled).toEqual([expect.objectContaining({
      missionId: draft.missionId,
      expectedVersion: 3,
      wakeAt: "2026-08-17T12:00:05.000Z",
      correlationId: scheduled[0]?.correlationId
    })]);
    expect(scheduled[0]?.correlationId).toMatch(/^corr_/);
    expect(notifications.records.size).toBe(0);
  });

  it("finishes at merchant-confirmed and deduplicates completion notification", async () => {
    const draft = makeDraft();
    const cases = new Cases({
      missionId: draft.missionId,
      ownerId: draft.ownerId,
      state: "WAITING_EXTERNAL",
      version: 2,
      plan: draft.plan
    });
    const notifications = new Notifications();
    const service = new VerificationService(cases, notifications);
    const result = await service.verifyOutcome(
      candidate("OUTCOME_CONFIRMED"),
      "2026-08-15T12:00:05.000Z"
    );
    expect(result.status).toBe("VERIFIED");
    expect(cases.item.state).toBe("DONE");
    expect(notifications.records.size).toBe(1);
  });
});
