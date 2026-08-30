import type { EvidenceCandidateContract } from "@dueback/contracts";
import { stableHash } from "@dueback/domain";
import type { FollowThroughStore } from "./case-runner";
import type { EvidenceService } from "./evidence-service";
import type { InterventionService } from "./interventions";

export interface InboundCorrelationStore extends FollowThroughStore {
  caseForReplyRoute(replyRoute: string): Promise<string | undefined>;
  caseForProviderMessageId?(providerMessageId: string): Promise<string | undefined>;
}

export interface NormalizedInboundEmail {
  readonly providerEmailId: string;
  readonly from: string;
  readonly to: readonly string[];
  readonly subject: string;
  readonly text: string;
  readonly messageId?: string;
  readonly inReplyTo?: string;
}

export interface InboundInterpretation {
  readonly replyType: "ACKNOWLEDGEMENT" | "STATUS" | "PROPOSAL_CHANGE" | "EVIDENCE" | "AUTO_REPLY" | "UNKNOWN";
  readonly evidenceLevel: EvidenceCandidateContract["level"];
  readonly transactionRef?: string | undefined;
  readonly amountMinor?: number | undefined;
  readonly currency?: string | undefined;
  readonly subject?: string | undefined;
  readonly billPeriod?: string | undefined;
  readonly trackingNumber?: string | undefined;
  readonly changedTerms: readonly string[];
  readonly uncertainty: "NONE" | "AMBIGUOUS" | "MISSING" | "CONTRADICTORY";
}

export interface InboundInterpreter {
  interpret(input: {
    readonly inboundId: string;
    readonly subject: string;
    readonly text: string;
  }): Promise<InboundInterpretation>;
}

function address(value: string): string {
  return (value.match(/<([^>]+)>/)?.[1] ?? value).trim().toLowerCase();
}

export class InboundService {
  constructor(
    private readonly cases: InboundCorrelationStore,
    private readonly interpreter: InboundInterpreter,
    private readonly evidence: EvidenceService,
    private readonly interventions: InterventionService
  ) {}

  async process(email: NormalizedInboundEmail, now: string): Promise<{
    status: "REJECTED" | "INSUFFICIENT" | "NEEDS_ATTENTION" | "VERIFIED";
    reasonCodes?: readonly string[];
  }> {
    const correlations = (await Promise.all(email.to.map((recipient) =>
      this.cases.caseForReplyRoute(address(recipient))
    ))).filter((caseId): caseId is string => Boolean(caseId));
    const uniqueCases = [...new Set(correlations)];
    if (uniqueCases.length !== 1) {
      return { status: "REJECTED", reasonCodes: [uniqueCases.length ? "AMBIGUOUS_CASE" : "UNKNOWN_CASE"] };
    }
    const caseId = uniqueCases[0];
    if (!caseId) return { status: "REJECTED", reasonCodes: ["UNKNOWN_CASE"] };
    if (email.inReplyTo && this.cases.caseForProviderMessageId) {
      const threadedCaseId = await this.cases.caseForProviderMessageId(email.inReplyTo);
      // Provider delivery IDs and RFC Message-IDs are different namespaces.
      // An indexed thread may veto an opaque route, but absence of an index
      // must not reject an otherwise exact case-specific reply address.
      if (threadedCaseId && threadedCaseId !== caseId) {
        return { status: "REJECTED", reasonCodes: ["THREAD_CORRELATION_MISMATCH"] };
      }
    }
    const item = await this.cases.get(caseId);
    if (!item) return { status: "REJECTED", reasonCodes: ["CASE_NOT_FOUND"] };
    if (!["RUNNING", "WAITING_EXTERNAL"].includes(item.state)) {
      return { status: "REJECTED", reasonCodes: ["CASE_NOT_ACCEPTING_INBOUND"] };
    }
    const correlationId = item.correlationId ?? `corr_${stableHash({ caseId }).slice(7, 31)}`;
    const expectedSender = address(item.plan.allowedRecipient);
    if (address(email.from) !== expectedSender) {
      await this.interventions.raise({
        caseId,
        ownerId: item.ownerId,
        correlationId,
        kind: "EVIDENCE_CONFLICT",
        reasonCodes: ["UNEXPECTED_SENDER"],
        requestedField: "sender identity",
        ...(item.plan.notificationRecipient
          ? { notificationRecipient: item.plan.notificationRecipient }
          : {}),
        createdAt: now
      });
      return { status: "NEEDS_ATTENTION", reasonCodes: ["UNEXPECTED_SENDER"] };
    }
    const interpretation = await this.interpreter.interpret({
      inboundId: email.providerEmailId,
      subject: email.subject,
      text: email.text
    });
    if (interpretation.replyType === "PROPOSAL_CHANGE" || interpretation.uncertainty !== "NONE") {
      await this.interventions.raise({
        caseId,
        ownerId: item.ownerId,
        correlationId,
        kind: "EVIDENCE_CONFLICT",
        reasonCodes: interpretation.changedTerms.length
          ? ["PROPOSAL_CHANGE", ...interpretation.changedTerms]
          : ["AMBIGUOUS_REPLY"],
        requestedField: "reply terms",
        ...(item.plan.notificationRecipient
          ? { notificationRecipient: item.plan.notificationRecipient }
          : {}),
        createdAt: now
      });
      return { status: "NEEDS_ATTENTION", reasonCodes: ["PROPOSAL_CHANGE"] };
    }
    const requirement = item.plan.evidenceRequirements[0];
    if (!requirement) throw new Error("EVIDENCE_REQUIREMENT_MISSING");
    const candidate: EvidenceCandidateContract = {
      evidenceId: `evidence_${stableHash({ namespace: "dueback/inbound-evidence/v1", id: email.providerEmailId }).slice(7, 31)}`,
      caseId,
      level: interpretation.evidenceLevel,
      ...(interpretation.amountMinor === undefined ? {} : { amountMinor: interpretation.amountMinor }),
      ...(interpretation.currency === undefined ? {} : { currency: interpretation.currency }),
      ...(interpretation.transactionRef === undefined
        ? {}
        : { transactionRef: interpretation.transactionRef }),
      ...(interpretation.subject === undefined ? {} : { subject: interpretation.subject }),
      ...(interpretation.billPeriod === undefined ? {} : { billPeriod: interpretation.billPeriod }),
      ...(interpretation.trackingNumber === undefined
        ? {}
        : { trackingNumber: interpretation.trackingNumber }),
      issuedAt: now,
      issuer: requirement.trustedIssuer,
      signatureValid: true
    };
    const reconciled = await this.evidence.reconcile(candidate, now, correlationId);
    return { status: reconciled.status };
  }
}
