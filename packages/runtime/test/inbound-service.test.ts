import { describe, expect, it, vi } from "vitest";
import type { ExecutionOutcomeContract } from "@actionos/contracts";
import { InboundService } from "../src/inbound-service";
import type { FollowThroughCase } from "../src/case-runner";
import type { VerificationService } from "../src/verification-service";
import type { InterventionService } from "../src/interventions";
import { makeDraft } from "./support";

const draft = makeDraft();
const item: FollowThroughCase = {
  missionId: draft.missionId,
  ownerId: draft.ownerId,
  state: "WAITING_EXTERNAL",
  version: 2,
  plan: draft.plan,
  boundary: {
    ownerId: draft.ownerId,
    planVersion: draft.plan.version,
    planHash: draft.plan.planHash,
    expiresAt: draft.plan.expiresAt
  },
  actionOrdinal: 1,
  dueAt: "2026-08-15T00:00:00.000Z"
};

const email = {
  providerEmailId: "email_123",
  from: "merchant@controlled.test",
  to: ["case+route@inbound.example.test"],
  subject: "Re: refund",
  text: "We received request ORDER-79"
};

describe("inbound service", () => {
  it("routes an acknowledgement through deterministic evidence reconciliation", async () => {
    const verifyOutcome = vi.fn((candidate: ExecutionOutcomeContract, now: string, correlationId: string) => {
      void candidate; void now; void correlationId;
      return Promise.resolve({ status: "INSUFFICIENT" as const, verification: { accepted: false, reasonCodes: ["INSUFFICIENT_STATUS" as const] } });
    });
    const service = new InboundService(
      { get: () => Promise.resolve(item), compareAndSet: () => Promise.resolve(), caseForReplyRoute: () => Promise.resolve(item.missionId) },
      { interpret: () => Promise.resolve({ replyType: "ACKNOWLEDGEMENT", evidenceLevel: "ACTION_ATTEMPTED", changedTerms: [], uncertainty: "NONE" }) },
      { verifyOutcome } as unknown as VerificationService,
      { raise: vi.fn() } as unknown as InterventionService
    );
    await expect(service.process(email, "2026-08-16T00:00:00.000Z")).resolves.toEqual({ status: "INSUFFICIENT" });
    expect(verifyOutcome).toHaveBeenCalledOnce();
    const candidate = verifyOutcome.mock.calls[0]?.[0];
    expect(candidate).not.toHaveProperty("amountMinor");
    expect(candidate).not.toHaveProperty("currency");
    expect(candidate).not.toHaveProperty("transactionRef");
  });

  it("never copies expected refund values into incomplete inbound evidence", async () => {
    const verifyOutcome = vi.fn((candidate: ExecutionOutcomeContract, now: string, correlationId: string) => {
      void candidate; void now; void correlationId;
      return Promise.resolve({
        status: "INSUFFICIENT" as const,
        verification: { accepted: false, reasonCodes: ["WRONG_AMOUNT" as const] }
      });
    });
    const service = new InboundService(
      { get: () => Promise.resolve(item), compareAndSet: () => Promise.resolve(), caseForReplyRoute: () => Promise.resolve(item.missionId) },
      { interpret: () => Promise.resolve({
        replyType: "EVIDENCE",
        evidenceLevel: "OUTCOME_CONFIRMED",
        changedTerms: [],
        uncertainty: "NONE"
      }) },
      { verifyOutcome } as unknown as VerificationService,
      { raise: vi.fn() } as unknown as InterventionService
    );
    await service.process({ ...email, text: "The refund was processed." }, "2026-08-16T00:00:00.000Z");
    const candidate = verifyOutcome.mock.calls[0]?.[0];
    expect(candidate).not.toHaveProperty("amountMinor");
    expect(candidate).not.toHaveProperty("currency");
    expect(candidate).not.toHaveProperty("transactionRef");
  });

  it("passes only explicitly extracted replacement subject and tracking facts", async () => {
    const replacement: FollowThroughCase = {
      ...item,
      plan: {
        ...item.plan,
        goalType: "REPLACEMENT",
        sharedFields: ["transactionRef", "subject"],
        evidenceRequirements: [{
          minimumStatus: "OUTCOME_CONFIRMED",
          transactionRef: "ORDER-79",
          subject: "damaged headphones",
          requiredOutcomeFields: ["subject", "trackingNumber"],
          maxAgeSeconds: 3600,
          trustedIssuer: "merchant-sandbox"
        }]
      }
    };
    const verifyOutcome = vi.fn((candidate: ExecutionOutcomeContract, now: string, correlationId: string) => {
      void candidate; void now; void correlationId;
      return Promise.resolve({
        status: "INSUFFICIENT" as const,
        verification: { accepted: false, reasonCodes: ["MISSING_TRACKING" as const] }
      });
    });
    const service = new InboundService(
      { get: () => Promise.resolve(replacement), compareAndSet: () => Promise.resolve(), caseForReplyRoute: () => Promise.resolve(item.missionId) },
      { interpret: () => Promise.resolve({
        replyType: "EVIDENCE",
        evidenceLevel: "OUTCOME_CONFIRMED",
        transactionRef: "ORDER-79",
        subject: "damaged headphones",
        changedTerms: [],
        uncertainty: "NONE"
      }) },
      { verifyOutcome } as unknown as VerificationService,
      { raise: vi.fn() } as unknown as InterventionService
    );
    await service.process(email, "2026-08-16T00:00:00.000Z");
    expect(verifyOutcome.mock.calls[0]?.[0]).toMatchObject({
      transactionRef: "ORDER-79",
      subject: "damaged headphones"
    });
    expect(verifyOutcome.mock.calls[0]?.[0]).not.toHaveProperty("trackingNumber");
  });

  it("rejects unknown routing without invoking the model", async () => {
    const interpret = vi.fn();
    const service = new InboundService(
      { get: () => Promise.resolve(undefined), compareAndSet: () => Promise.resolve(), caseForReplyRoute: () => Promise.resolve(undefined) },
      { interpret },
      { verifyOutcome: vi.fn() } as unknown as VerificationService,
      { raise: vi.fn() } as unknown as InterventionService
    );
    await expect(service.process(email, "2026-08-16T00:00:00.000Z")).resolves.toMatchObject({ status: "REJECTED", reasonCodes: ["UNKNOWN_CASE"] });
    expect(interpret).not.toHaveBeenCalled();
  });

  it("requires an available In-Reply-To header to agree with the opaque reply route", async () => {
    const interpret = vi.fn();
    const service = new InboundService(
      {
        get: () => Promise.resolve(item), compareAndSet: () => Promise.resolve(),
        caseForReplyRoute: () => Promise.resolve(item.missionId),
        caseForProviderMessageId: () => Promise.resolve("case_other")
      },
      { interpret },
      { verifyOutcome: vi.fn() } as unknown as VerificationService,
      { raise: vi.fn() } as unknown as InterventionService
    );
    await expect(service.process({ ...email, inReplyTo: "provider_message_123" }, "2026-08-16T00:00:00.000Z"))
      .resolves.toMatchObject({ status: "REJECTED", reasonCodes: ["THREAD_CORRELATION_MISMATCH"] });
    expect(interpret).not.toHaveBeenCalled();
  });

  it("does not confuse an unknown RFC Message-ID with a contradictory case mapping", async () => {
    const interpret = vi.fn(() => Promise.resolve({
      replyType: "ACKNOWLEDGEMENT" as const,
      evidenceLevel: "ACTION_ATTEMPTED" as const,
      changedTerms: [],
      uncertainty: "NONE" as const
    }));
    const verifyOutcome = vi.fn(() => Promise.resolve({ status: "INSUFFICIENT" as const }));
    const service = new InboundService(
      {
        get: () => Promise.resolve(item), compareAndSet: () => Promise.resolve(),
        caseForReplyRoute: () => Promise.resolve(item.missionId),
        caseForProviderMessageId: () => Promise.resolve(undefined)
      },
      { interpret },
      { verifyOutcome } as unknown as VerificationService,
      { raise: vi.fn() } as unknown as InterventionService
    );
    await expect(service.process({ ...email, inReplyTo: "<rfc-message@example.test>" }, "2026-08-16T00:00:00.000Z"))
      .resolves.toMatchObject({ status: "INSUFFICIENT" });
    expect(interpret).toHaveBeenCalledOnce();
    expect(verifyOutcome).toHaveBeenCalledOnce();
  });

  it("escalates an unexpected sender before interpreting content", async () => {
    const interpret = vi.fn();
    const raise = vi.fn(() => Promise.resolve({}));
    const service = new InboundService(
      { get: () => Promise.resolve(item), compareAndSet: () => Promise.resolve(), caseForReplyRoute: () => Promise.resolve(item.missionId) },
      { interpret },
      { verifyOutcome: vi.fn() } as unknown as VerificationService,
      { raise } as unknown as InterventionService
    );
    await expect(service.process({ ...email, from: "attacker@example.test" }, "2026-08-16T00:00:00.000Z")).resolves.toMatchObject({ status: "NEEDS_ATTENTION" });
    expect(interpret).not.toHaveBeenCalled();
    expect(raise).toHaveBeenCalledOnce();
  });

  it("rejects ambiguous routing and terminal late replies before invoking the model", async () => {
    const interpret = vi.fn();
    const ambiguous = new InboundService(
      {
        get: () => Promise.resolve(item),
        compareAndSet: () => Promise.resolve(),
        caseForReplyRoute: (route) => Promise.resolve(route.includes("other") ? "case_other" : item.missionId)
      },
      { interpret },
      { verifyOutcome: vi.fn() } as unknown as VerificationService,
      { raise: vi.fn() } as unknown as InterventionService
    );
    await expect(ambiguous.process({ ...email, to: [email.to[0] ?? "", "case+other@inbound.example.test"] }, "2026-08-16T00:00:00.000Z"))
      .resolves.toMatchObject({ status: "REJECTED", reasonCodes: ["AMBIGUOUS_CASE"] });

    const terminal = new InboundService(
      {
        get: () => Promise.resolve({ ...item, state: "CANCELLED" }),
        compareAndSet: () => Promise.resolve(),
        caseForReplyRoute: () => Promise.resolve(item.missionId)
      },
      { interpret },
      { verifyOutcome: vi.fn() } as unknown as VerificationService,
      { raise: vi.fn() } as unknown as InterventionService
    );
    await expect(terminal.process(email, "2026-08-16T00:00:00.000Z"))
      .resolves.toMatchObject({ status: "REJECTED", reasonCodes: ["CASE_NOT_ACCEPTING_INBOUND"] });
    expect(interpret).not.toHaveBeenCalled();
  });

  it("escalates changed terms without letting the model mutate the plan", async () => {
    const raise = vi.fn(() => Promise.resolve({}));
    const verifyOutcome = vi.fn();
    const service = new InboundService(
      { get: () => Promise.resolve(item), compareAndSet: () => Promise.resolve(), caseForReplyRoute: () => Promise.resolve(item.missionId) },
      { interpret: () => Promise.resolve({
        replyType: "PROPOSAL_CHANGE",
        evidenceLevel: "SYSTEM_ACKNOWLEDGED",
        changedTerms: ["amountMinor"],
        uncertainty: "NONE"
      }) },
      { verifyOutcome } as unknown as VerificationService,
      { raise } as unknown as InterventionService
    );
    await expect(service.process(email, "2026-08-16T00:00:00.000Z"))
      .resolves.toMatchObject({ status: "NEEDS_ATTENTION", reasonCodes: ["PROPOSAL_CHANGE"] });
    expect(verifyOutcome).not.toHaveBeenCalled();
    expect(raise).toHaveBeenCalledOnce();
  });
});
