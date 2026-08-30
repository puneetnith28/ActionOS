import { describe, expect, it, vi } from "vitest";
import {
  ActionBroker,
  type ActionReceipt,
  type ActionRecordStore,
  type ClosedActionAdapter,
  type Reservation
} from "../../packages/runtime/src/action-broker";
import {
  reduceCase,
  verifyEvidence,
  type ApprovedActionPolicy,
  type CaseSnapshot,
  type EvidenceCandidate,
  type EvidenceRequirement,
  type ProposedCapabilityExecution
} from "../../packages/domain/src/index";

class ContractStore implements ActionRecordStore {
  private readonly records = new Map<string, Reservation>();

  reserve(key: string): Promise<Reservation> {
    const record = this.records.get(key);
    if (record?.status === "SUCCEEDED") return Promise.resolve(record);
    if (record) return Promise.resolve({ status: "IN_FLIGHT" });
    this.records.set(key, { status: "RESERVED" });
    return Promise.resolve({ status: "RESERVED" });
  }

  succeed(key: string, receipt: ActionReceipt): Promise<void> {
    this.records.set(key, { status: "SUCCEEDED", receipt });
    return Promise.resolve();
  }

  fail(key: string): Promise<void> {
    this.records.delete(key);
    return Promise.resolve();
  }
}

const approval = {
  ownerId: "person_1",
  planVersion: 1,
  planHash: "sha256:plan",
  expiresAt: "2999-08-16T00:00:00.000Z"
} as const;

const policy: ApprovedActionPolicy = {
  ownerId: approval.ownerId,
  planVersion: approval.planVersion,
  planHash: approval.planHash,
  allowedActions: ["SEND_FOLLOW_UP"],
  allowedRecipient: "merchant@example.test",
  sharedFields: ["transactionRef"],
  approval
};

const proposal: ProposedCapabilityExecution = {
  ownerId: approval.ownerId,
  planVersion: approval.planVersion,
  planHash: approval.planHash,
  actionType: "SEND_FOLLOW_UP",
  recipient: policy.allowedRecipient,
  sharedFields: { transactionRef: "ORDER-79" }
};

describe("cross-package domain invariants", () => {
  it("keeps acknowledgement open even after one idempotent action succeeds", async () => {
    const execute = vi.fn<ClosedActionAdapter["execute"]>(() =>
      Promise.resolve({ receiptId: "receipt_1", acceptedAt: "2026-08-15T12:00:00.000Z" })
    );
    const broker = new ActionBroker(new ContractStore(), { execute });
    const action = {
      caseId: "case_1",
      actionOrdinal: 1,
      policy,
      proposal,
      now: "2026-08-15T12:00:00.000Z"
    };
    await broker.execute(action);
    await broker.execute(action);
    expect(execute).toHaveBeenCalledTimes(1);

    const requirement: EvidenceRequirement = {
      minimumLevel: "MERCHANT_CONFIRMED",
      amountMinor: 7900,
      currency: "USD",
      transactionRef: "ORDER-79",
      maxAgeSeconds: 3600,
      trustedIssuer: "merchant-sandbox"
    };
    const acknowledgement: EvidenceCandidate = {
      evidenceId: "evidence_1",
      caseId: "case_1",
      level: "REQUEST_ACKNOWLEDGED",
      amountMinor: 7900,
      currency: "USD",
      transactionRef: "ORDER-79",
      issuedAt: "2026-08-15T12:00:00.000Z",
      issuer: "merchant-sandbox",
      signatureValid: true
    };
    const verification = verifyEvidence({
      caseId: "case_1",
      requirement,
      candidate: acknowledgement,
      now: "2026-08-15T12:05:00.000Z"
    });
    expect(verification.accepted).toBe(false);

    const running: CaseSnapshot = {
      caseId: "case_1",
      ownerId: approval.ownerId,
      state: "RUNNING",
      version: 3,
      planVersion: 1,
      planHash: approval.planHash,
      approval
    };
    expect(() =>
      reduceCase(running, {
        expectedVersion: 3,
        target: "DONE",
        actor: "SYSTEM",
        reasonCode: "REQUEST_ACKNOWLEDGED",
        verification
      })
    ).toThrow(/DONE requires accepted deterministic verification/);
  });
});
