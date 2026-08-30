import { randomUUID } from "node:crypto";
import { outcomeContractSchema, promiseDraftSchema, resolutionPlanSchema } from "@actionos/contracts";
import type { ChannelType, OutcomeContract, PromiseDraft, ExecutionPlan } from "@actionos/contracts";
import { caseDedupeKey, stableHash } from "@actionos/domain";

export interface IntakeArtifact {
  readonly missionId?: string;
  readonly artifactId: string;
  readonly ownerId: string;
  readonly sourceChannel: "upload" | "paste" | "fixture";
  readonly sha256: string;
  readonly content:
    | string
    | {
      readonly dataUrl: string;
      readonly contentType: "image/jpeg" | "image/png" | "application/pdf";
      readonly contextText?: string;
      };
}

export interface PromiseExtractor {
  extract(artifact: IntakeArtifact): Promise<PromiseDraft>;
}

export interface DraftCase {
  readonly missionId: string;
  readonly ownerId: string;
  readonly artifactId: string;
  readonly dedupeKey: string;
  readonly state: "AWAITING_APPROVAL" | "READY" | "CANCELLED";
  readonly promiseDraft: PromiseDraft;
  readonly outcomeContract?: OutcomeContract;
  readonly plan: ExecutionPlan;
  readonly activationBlocked: boolean;
  readonly blockingFields: readonly string[];
  readonly createdAt: string;
  readonly boundary?: PlanApproval;
}

export function commercialOutcomeContract(
  contractId: string,
  draft: PromiseDraft
): OutcomeContract {
  return outcomeContractSchema.parse({
    contractId,
    recipe: "COMMERCIAL_FOLLOW_UP",
    outcome: draft.result.value,
    responsibleParty: draft.promisor.value,
    ...(draft.dueAt?.uncertainty === "NONE" ? { dueAt: draft.dueAt.value } : {}),
    proofRequired:
      "Signed evidence from the responsible party confirming the exact outcome and reference.",
    actionIntents: ["FOLLOW_UP", "CHECK_STATUS"],
    recipeData: {
      reference: draft.transactionRef.value,
      ...(draft.amountMinor ? { amountMinor: draft.amountMinor.value } : {}),
      ...(draft.currency ? { currency: draft.currency.value } : {})
    }
  });
}

export interface PlanApproval {
  readonly approvalId: string;
  readonly ownerId: string;
  readonly missionId: string;
  readonly planVersion: number;
  readonly planHash: string;
  readonly approvedAt: string;
  readonly expiresAt: string;
}

export interface IntakeStore {
  findByDedupeKey(ownerId: string, dedupeKey: string): Promise<DraftCase | undefined>;
  createDraft(draft: DraftCase): Promise<void>;
}

export interface NewCaseBudget {
  consume(ownerId: string, now: string): Promise<void>;
}

export function blockingCriticalFields(
  draft: PromiseDraft,
  followUpAt?: string,
  allowedRecipient?: string
): string[] {
  const fields: [string, { uncertainty: string } | undefined][] = [
    ["promisor", draft.promisor],
    ["result", draft.result],
    ["transactionRef", draft.transactionRef]
  ];
  if (draft.promiseType === "REFUND" || draft.promiseType === "BILL_CREDIT" || draft.amountMinor || draft.currency) {
    fields.push(["amountMinor", draft.amountMinor], ["currency", draft.currency]);
  }
  const blocked = fields
    .filter(([, field]) => !field || field.uncertainty !== "NONE")
    .map(([name]) => name);
  const extractedDeadline = draft.dueAt?.uncertainty === "NONE" ? draft.dueAt.value : undefined;
  if (!followUpAt && !extractedDeadline) blocked.push("followUpAt");
  if (allowedRecipient?.endsWith(".invalid")) blocked.push("allowedRecipient");
  return blocked;
}

export function followUpMessage(draft: PromiseDraft): { subject: string; body: string } {
  const amountLine = draft.amountMinor && draft.currency
    ? `Amount: ${draft.currency.value} ${(draft.amountMinor.value / 100).toFixed(2)}`
    : undefined;
  return {
    subject: `Follow-up for ${draft.transactionRef.value}`,
    body: [
      "Hello,",
      "",
      "DueBack is following up on an outcome requested by your customer.",
      `Requested outcome: ${draft.result.value}`,
      `Reference: ${draft.transactionRef.value}`,
      amountLine,
      "Please reply with the current status and verifiable confirmation when the outcome is complete.",
      "An acknowledgement that the request was received will not be treated as completion."
    ].filter((line): line is string => Boolean(line)).join("\n")
  };
}

function buildPlan(input: {
  readonly missionId: string;
  readonly ownerId: string;
  readonly draft: PromiseDraft;
  readonly recipient: string;
  readonly now: string;
  readonly channel: {
    readonly channelType: ChannelType;
    readonly senderIdentity: string;
    readonly replyRoute: string;
  };
}): ExecutionPlan {
  const { draft } = input;
  // BILL_CREDIT needs a bill period that the current intake contract cannot yet
  // extract. Keep the promise usable as a general follow-up instead of creating
  // a plan that can never satisfy its evidence schema.
  const extractedPromiseType = draft.promiseType === "BILL_CREDIT" ? "GENERAL" : draft.promiseType;
  const promiseType = extractedPromiseType ??
    (draft.amountMinor || draft.currency ? "REFUND" : "GENERAL");
  const message = followUpMessage(draft);
  const unsigned = {
    planId: `plan_${randomUUID()}`,
    missionId: input.missionId,
    ownerId: input.ownerId,
    version: 1,
    goal: draft.result.value,
    counterpartyName: /^[^@\s]+@[^@\s]+$/.test(draft.promisor.value)
      ? "Company"
      : draft.promisor.value,
    promiseType,
    executionMode: input.channel.channelType === "CONTROLLED_SANDBOX"
      ? "ACCELERATED_DEMO" as const
      : "CONTROLLED_REAL_PILOT" as const,
    timingPolicyVersion: input.channel.channelType === "CONTROLLED_SANDBOX"
      ? "accelerated-demo/v1"
      : "controlled-real-pilot/v1",
    allowedActions: ["SEND_FOLLOW_UP"] as const,
    allowedRecipient: input.recipient,
    channelType: input.channel.channelType,
    senderIdentity: input.channel.senderIdentity,
    replyRoute: input.channel.replyRoute,
    messageTemplateVersion: "company-follow-up/v1",
    messageSubject: message.subject,
    messageBody: message.body,
    followUpIntervalSeconds: input.channel.channelType === "CONTROLLED_SANDBOX"
      ? 8
      : 2 * 24 * 60 * 60,
    maxLogicalSends: 3,
    sharedFields: [
      "transactionRef",
      ...(draft.amountMinor ? ["amountMinor"] : []),
      ...(draft.currency ? ["currency"] : []),
      ...(promiseType === "REPLACEMENT" ? ["subject"] : [])
    ],
    ...(input.channel.channelType === "CONTROLLED_SANDBOX"
      ? { followUpAt: new Date(Date.parse(input.now) + 2_000).toISOString() }
      : draft.dueAt?.uncertainty === "NONE"
        ? { followUpAt: draft.dueAt.value }
        : {}),
    evidenceRequirements: [
      {
        minimumStatus: "OUTCOME_CONFIRMED" as const,
        ...(draft.amountMinor ? { amountMinor: draft.amountMinor.value } : {}),
        ...(draft.currency ? { currency: draft.currency.value } : {}),
        ...(promiseType === "REPLACEMENT"
          ? {
              subject: draft.result.value,
              requiredOutcomeFields: ["subject", "trackingNumber"] as const
            }
          : {}),
        transactionRef: draft.transactionRef.value,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        trustedIssuer: input.channel.channelType === "MANAGED_EMAIL"
          ? `managed-email:${stableHash({
              namespace: "dueback/recipient/v1",
              recipient: input.recipient.toLowerCase()
            }).slice(7, 31)}`
          : "merchant-sandbox"
      }
    ],
    expiresAt: new Date(Date.parse(input.now) + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
  return resolutionPlanSchema.parse({ ...unsigned, planHash: stableHash(unsigned) });
}

export class IntakeService {
  constructor(
    private readonly store: IntakeStore,
    private readonly extractor: PromiseExtractor,
    private readonly merchantRecipient: string,
    private readonly budget?: NewCaseBudget,
    private readonly channel: {
      readonly channelType: ChannelType;
      readonly senderIdentity: string;
      readonly replyRoute: string;
    } = {
      channelType: "CONTROLLED_SANDBOX",
      senderIdentity: "DueBack controlled demo",
      replyRoute: "Signed callback"
    }
  ) {}

  async intake(
    artifact: IntakeArtifact,
    now: string
  ): Promise<{ draft: DraftCase; duplicate: boolean }> {
    const dedupeKey = caseDedupeKey({
      ownerId: artifact.ownerId,
      sourceChannel: artifact.sourceChannel,
      sourceIdentity: artifact.sha256
    });
    const existing = await this.store.findByDedupeKey(artifact.ownerId, dedupeKey);
    if (existing) return { draft: existing, duplicate: true };

    await this.budget?.consume(artifact.ownerId, now);

    const promiseDraft = promiseDraftSchema.parse(await this.extractor.extract(artifact));
    const missionId = artifact.missionId ?? `case_${randomUUID()}`;
    const plan = buildPlan({
      missionId,
      ownerId: artifact.ownerId,
      draft: promiseDraft,
      recipient: this.merchantRecipient,
      now,
      channel: this.channel
    });
    const blockingFields = blockingCriticalFields(
      promiseDraft,
      plan.followUpAt,
      plan.allowedRecipient
    );
    const draft: DraftCase = {
      missionId,
      ownerId: artifact.ownerId,
      artifactId: artifact.artifactId,
      dedupeKey,
      state: "AWAITING_APPROVAL",
      promiseDraft,
      outcomeContract: commercialOutcomeContract(`outcome_${randomUUID()}`, promiseDraft),
      plan,
      activationBlocked: blockingFields.length > 0,
      blockingFields,
      createdAt: now
    };
    await this.store.createDraft(draft);
    return { draft, duplicate: false };
  }
}
