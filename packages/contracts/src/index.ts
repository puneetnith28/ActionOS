import { z } from "zod";

export const opaqueIdSchema = z.string().min(8).max(128);
export const isoDateSchema = z.iso.datetime({ offset: true });
export const sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/);
export const currencySchema = z.string().regex(/^[A-Z]{3}$/);
export const channelTypeSchema = z.enum([
  "CONTROLLED_SANDBOX",
  "MANAGED_EMAIL",
  "GMAIL_CONNECTED",
  "PARTNER_API"
]);

export const channelCapabilitySchema = z.object({
  channelType: channelTypeSchema,
  status: z.enum(["AVAILABLE", "DEGRADED", "UNAVAILABLE", "FUTURE"]),
  canSend: z.boolean(),
  canReceive: z.boolean(),
  supportsThreading: z.boolean(),
  supportsDeliveryReceipt: z.boolean(),
  supportsAuthenticatedReply: z.boolean(),
  requiresUserOAuth: z.boolean(),
  reasonCodes: z.array(z.string().min(1).max(100)).max(10),
  checkedAt: isoDateSchema
});

export const transportStatusSchema = z.enum([
  "ACCEPTED",
  "DELIVERED",
  "BOUNCED",
  "COMPLAINED",
  "SUPPRESSED",
  "FAILED",
  "UNKNOWN"
]);

export const actionReceiptSchema = z.object({
  receiptId: opaqueIdSchema,
  missionId: opaqueIdSchema.optional(),
  channelType: channelTypeSchema.optional(),
  providerMessageId: z.string().min(1).max(300).optional(),
  replyRoute: z.string().min(1).max(320).optional(),
  recipientFingerprint: sha256Schema.optional(),
  transportStatus: transportStatusSchema.optional(),
  acceptedAt: isoDateSchema,
  observedAt: isoDateSchema.optional(),
  correlationId: opaqueIdSchema.optional(),
  capabilityIdempotencyKey: sha256Schema.optional(),
  reasonCodes: z.array(z.string().min(1).max(100)).max(10).optional()
});

export const messageThreadSchema = z.object({
  threadId: opaqueIdSchema,
  missionId: opaqueIdSchema,
  channelType: channelTypeSchema,
  replyRouteFingerprint: sha256Schema,
  providerMessageId: z.string().min(1).max(300),
  createdAt: isoDateSchema,
  expiresAt: isoDateSchema
});

export const deliveryEventSchema = z.object({
  deliveryEventId: opaqueIdSchema,
  providerEventId: opaqueIdSchema,
  providerMessageId: z.string().min(1).max(300),
  missionId: opaqueIdSchema.optional(),
  channelType: channelTypeSchema,
  status: transportStatusSchema,
  observedAt: isoDateSchema,
  reasonCodes: z.array(z.string().min(1).max(100)).max(10)
});

export const providerEventSchema = z.object({
  providerEventId: opaqueIdSchema,
  provider: z.enum(["RESEND", "MERCHANT_SANDBOX", "PARTNER_FIXTURE"]),
  eventType: z.string().min(1).max(100),
  payloadHash: sha256Schema,
  signatureValid: z.literal(true),
  status: z.enum(["RESERVED", "ENQUEUED", "PROCESSED", "REJECTED", "FAILED"]),
  receivedAt: isoDateSchema,
  processedAt: isoDateSchema.optional(),
  reasonCodes: z.array(z.string().min(1).max(100)).max(10)
});

export const inboundEnvelopeSchema = z.object({
  inboundId: opaqueIdSchema,
  providerEventId: opaqueIdSchema,
  providerEmailId: opaqueIdSchema,
  channelType: channelTypeSchema,
  missionId: opaqueIdSchema.optional(),
  correlationStatus: z.enum(["EXACT", "AMBIGUOUS", "UNKNOWN", "REJECTED"]),
  senderFingerprint: sha256Schema,
  recipientRouteFingerprints: z.array(sha256Schema).min(1).max(10),
  messageId: z.string().min(1).max(500).optional(),
  inReplyTo: z.string().min(1).max(500).optional(),
  subject: z.string().max(300),
  text: z.string().max(100_000),
  contentHash: sha256Schema,
  providerSignatureValid: z.boolean(),
  receivedAt: isoDateSchema
});

export const verificationStatusSchema = z.enum([
  "PLANNED",
  "ACTION_ATTEMPTED",
  "SYSTEM_ACKNOWLEDGED",
  "OUTCOME_CONFIRMED",
  "STATE_VERIFIED"
]);

export const fieldProvenanceSchema = z.object({
  artifactId: opaqueIdSchema,
  locator: z.string().min(1).max(256),
  excerpt: z.string().min(1).max(160).optional(),
  excerptHash: sha256Schema,
  confidence: z.enum(["HIGH", "MEDIUM", "LOW", "UNKNOWN"])
});

export const extractedFieldSchema = <T extends z.ZodType>(value: T) =>
  z.object({
    value,
    provenance: z.array(fieldProvenanceSchema).min(1),
    uncertainty: z.enum(["NONE", "AMBIGUOUS", "MISSING", "CONTRADICTORY"])
  });

export const missionGoalSchema = z.object({
  goalType: z.enum(["REFUND", "BILL_CREDIT", "REPLACEMENT", "GENERAL"]).optional(),
  promisor: extractedFieldSchema(z.string().min(1).max(200)),
  result: extractedFieldSchema(z.string().min(1).max(500)),
  amountMinor: extractedFieldSchema(z.int().nonnegative()).optional(),
  currency: extractedFieldSchema(currencySchema).optional(),
  transactionRef: extractedFieldSchema(z.string().min(1).max(200)),
  dueAt: extractedFieldSchema(isoDateSchema).optional(),
  dueCondition: extractedFieldSchema(z.string().min(1).max(300)).optional(),
  proposedVerificationStatus: verificationStatusSchema
});

const outcomeContractBaseSchema = z.object({
  contractId: opaqueIdSchema,
  outcome: z.string().min(1).max(500),
  responsibleParty: z.string().min(1).max(200),
  dueAt: isoDateSchema.optional(),
  proofRequired: z.string().min(1).max(500),
  actionIntents: z
    .array(
      z.enum([
        "FOLLOW_UP",
        "CHECK_STATUS",
        "FIND_OPTION",
        "RESERVE_APPOINTMENT",
        "REQUEST_DOCUMENT"
      ])
    )
    .min(1)
    .max(5)
});

export const outcomeContractSchema = z.discriminatedUnion("recipe", [
  outcomeContractBaseSchema.extend({
    recipe: z.literal("COMMERCIAL_FOLLOW_UP"),
    recipeData: z.object({
      reference: z.string().min(1).max(200),
      amountMinor: z.int().nonnegative().optional(),
      currency: currencySchema.optional()
    })
  }),
  outcomeContractBaseSchema.extend({
    recipe: z.literal("APPOINTMENT"),
    recipeData: z.object({
      service: z.string().min(1).max(200),
      acceptableWindows: z.array(z.string().min(1).max(200)).min(1).max(10),
      location: z.string().min(1).max(300).optional()
    })
  }),
  outcomeContractBaseSchema.extend({
    recipe: z.literal("DOCUMENT"),
    recipeData: z.object({
      documentName: z.string().min(1).max(200),
      deliveryChannel: z.string().min(1).max(100).optional()
    })
  })
]);

const safeDisplayTextSchema = (maximum: number) => z.string().min(1).max(maximum).refine(
  (value) => !/^[^@\s]+@[^@\s]+$/.test(value) || value.includes("•"),
  "Full email addresses are not allowed in consumer projections"
);

export const resolutionPlanSchema = z
  .object({
    planId: opaqueIdSchema,
    missionId: opaqueIdSchema,
    ownerId: opaqueIdSchema,
    version: z.int().positive(),
    planHash: sha256Schema,
    goal: z.string().min(1).max(500),
    counterpartyName: safeDisplayTextSchema(200).optional(),
    goalType: z.enum(["REFUND", "BILL_CREDIT", "REPLACEMENT", "GENERAL"]).optional(),
    executionMode: z.enum(["ACCELERATED_DEMO", "CONTROLLED_REAL_PILOT"]).optional(),
    timingPolicyVersion: z.string().min(1).max(80).optional(),
    allowedActions: z
      .array(z.enum(["SEND_FOLLOW_UP", "CHECK_STATUS"]))
      .min(1)
      .max(2),
    allowedRecipient: z.string().min(1).max(320),
    channelType: channelTypeSchema.optional(),
    senderIdentity: z.string().min(1).max(320).optional(),
    replyRoute: z.string().min(1).max(320).optional(),
    messageTemplateVersion: z.string().min(1).max(80).optional(),
    messageSubject: z.string().min(1).max(300).optional(),
    messageBody: z.string().min(1).max(10_000).optional(),
    followUpIntervalSeconds: z.int().positive().max(30 * 24 * 60 * 60).optional(),
    maxLogicalSends: z.int().positive().max(3).optional(),
    recipientConfirmedAt: isoDateSchema.optional(),
    notificationRecipient: z.email().max(320).optional(),
    sharedFields: z.array(z.string().min(1).max(80)).max(12),
    followUpAt: isoDateSchema.optional(),
    evidenceRequirements: z
      .array(
        z.object({
          minimumStatus: verificationStatusSchema,
          amountMinor: z.int().nonnegative().optional(),
          currency: currencySchema.optional(),
          transactionRef: z.string().min(1).max(200),
          subject: z.string().min(1).max(300).optional(),
          billPeriod: z.string().min(1).max(100).optional(),
          requiredOutcomeFields: z
            .array(z.enum(["amountMinor", "currency", "subject", "billPeriod", "trackingNumber"]))
            .max(5)
            .optional(),
          maxAgeSeconds: z.int().positive(),
          trustedIssuer: z.string().min(1).max(200)
        })
      )
      .min(1),
    expiresAt: isoDateSchema
  })
  .superRefine((plan, context) => {
    const goalType = plan.goalType ?? "REFUND";
    for (const [index, requirement] of plan.evidenceRequirements.entries()) {
      if (
        ["REFUND", "BILL_CREDIT"].includes(goalType) &&
        (requirement.amountMinor === undefined || requirement.currency === undefined)
      ) {
        context.addIssue({
          code: "custom",
          path: ["evidenceRequirements", index],
          message: "Money evidence is required"
        });
      }
      if (goalType === "BILL_CREDIT" && !requirement.billPeriod) {
        context.addIssue({
          code: "custom",
          path: ["evidenceRequirements", index, "billPeriod"],
          message: "Bill period is required"
        });
      }
      if (
        goalType === "REPLACEMENT" &&
        (!requirement.subject || !requirement.requiredOutcomeFields?.includes("trackingNumber"))
      ) {
        context.addIssue({
          code: "custom",
          path: ["evidenceRequirements", index],
          message: "Replacement subject and tracking proof are required"
        });
      }
    }
  });

// ConversationPlan is the channel-complete name for the backwards-compatible ExecutionPlan.
export const conversationPlanSchema = resolutionPlanSchema;

export const analysisJobSchema = z.object({
  jobId: opaqueIdSchema,
  missionId: opaqueIdSchema,
  ownerId: opaqueIdSchema,
  artifactId: opaqueIdSchema,
  artifactPath: z.string().min(1).max(500),
  sourceChannel: z.enum(["upload", "paste"]),
  mediaType: z.enum(["text/plain", "image/jpeg", "image/png", "application/pdf"]),
  sha256: sha256Schema,
  contextText: z.string().max(50_000).optional(),
  status: z.enum(["QUEUED", "ANALYZING", "READY", "FAILED"]),
  stage: z.enum(["EVIDENCE_SECURED", "GEMINI_EXTRACTION", "VALIDATING", "REVIEW_READY", "FAILED"]),
  attemptCount: z.int().nonnegative().max(3),
  createdAt: isoDateSchema,
  updatedAt: isoDateSchema,
  leaseUntil: isoDateSchema.optional(),
  lastError: z.string().min(1).max(120).optional()
}).strict();

export const actionEnvelopeSchema = z.object({
  actionId: opaqueIdSchema,
  idempotencyKey: sha256Schema,
  missionId: opaqueIdSchema,
  ownerId: opaqueIdSchema,
  planVersion: z.int().positive(),
  planHash: sha256Schema,
  actionType: z.enum(["SEND_FOLLOW_UP", "CHECK_STATUS"]),
  channelType: channelTypeSchema.optional(),
  recipient: z.string().min(1).max(320),
  sharedFields: z.record(z.string(), z.string().max(500)),
  requestedAt: isoDateSchema
});

export const executionOutcomeSchema = z.object({
  outcomeId: opaqueIdSchema,
  missionId: opaqueIdSchema,
  status: verificationStatusSchema,
  amountMinor: z.int().nonnegative().optional(),
  currency: currencySchema.optional(),
  transactionRef: z.string().min(1).max(200).optional(),
  subject: z.string().min(1).max(300).optional(),
  billPeriod: z.string().min(1).max(100).optional(),
  trackingNumber: z.string().min(1).max(200).optional(),
  issuedAt: isoDateSchema,
  issuer: z.string().min(1).max(200),
  signatureValid: z.boolean()
});

export const caseEventSchema = z.object({
  eventId: opaqueIdSchema,
  missionId: opaqueIdSchema,
  sequence: z.int().positive(),
  type: z.string().min(1).max(100),
  actor: z.enum(["PERSON", "SYSTEM", "MODEL", "ADAPTER", "SANDBOX"]),
  occurredAt: isoDateSchema,
  correlationId: opaqueIdSchema,
  payloadHash: sha256Schema,
  schemaVersion: z.literal(1)
});

export const notificationSchema = z.object({
  notificationId: opaqueIdSchema,
  dedupeKey: sha256Schema,
  missionId: opaqueIdSchema,
  correlationId: opaqueIdSchema,
  kind: z.enum(["BOUNDARY_REQUIRED", "NEEDS_ATTENTION", "CASE_COMPLETED", "CASE_FAILED"]),
  deepLinkPath: z.string().startsWith("/cases/"),
  createdAt: isoDateSchema,
  deliveryChannel: z.enum(["IN_APP", "EMAIL"]).optional(),
  deliveryStatus: z.enum([
    "RECORDED",
    "ACCEPTED",
    "DELIVERED",
    "BOUNCED",
    "SUPPRESSED",
    "FAILED",
    "UNAVAILABLE"
  ]).optional(),
  destinationHint: safeDisplayTextSchema(320).optional(),
  attemptCount: z.int().nonnegative().max(3).optional(),
  lastAttemptAt: isoDateSchema.optional(),
  deliveredAt: isoDateSchema.optional()
});

export const identityClaimSchema = z.object({
  claimId: opaqueIdSchema,
  missionId: opaqueIdSchema,
  sourceOwnerFingerprint: sha256Schema,
  targetOwnerFingerprint: sha256Schema,
  operation: z.enum(["LINK_CURRENT", "CLAIM_DRAFT"]),
  status: z.enum(["PENDING", "COMPLETED", "COLLISION", "REJECTED"]),
  idempotencyKey: sha256Schema,
  requestedAt: isoDateSchema,
  completedAt: isoDateSchema.optional(),
  reasonCodes: z.array(z.string().min(1).max(100)).max(10)
}).strict();

export const caseSummarySchema = z.object({
  missionId: opaqueIdSchema,
  companyName: safeDisplayTextSchema(120),
  outcomeLabel: safeDisplayTextSchema(300),
  bucket: z.enum(["NEEDS_YOU", "WORKING", "DONE"]),
  statusLabel: safeDisplayTextSchema(120),
  lastActivityAt: isoDateSchema,
  nextStepLabel: safeDisplayTextSchema(300),
  attentionRequired: z.boolean(),
  channelLabel: z.enum(["Email", "Controlled demo"])
}).strict();

export const conversationEntrySchema = z.object({
  entryId: opaqueIdSchema,
  direction: z.enum(["OUTBOUND", "INBOUND", "SYSTEM"]),
  occurredAt: isoDateSchema,
  channelLabel: z.enum(["Email", "Controlled demo"]),
  partyLabel: safeDisplayTextSchema(120),
  safeSummary: safeDisplayTextSchema(500),
  transportStatus: transportStatusSchema.optional(),
  authenticity: z.enum(["VERIFIED_ROUTE", "UNVERIFIED", "NOT_APPLICABLE"]),
  evidenceDecision: z.enum(["PENDING", "INSUFFICIENT", "ACCEPTED", "NOT_APPLICABLE"]),
  reasonSummary: safeDisplayTextSchema(300).optional()
}).strict();

export const outcomeComparisonSchema = z.object({
  verificationStatus: verificationStatusSchema.optional(),
  accepted: z.boolean(),
  limitation: safeDisplayTextSchema(500),
  fields: z.array(z.object({
    label: safeDisplayTextSchema(80),
    promised: safeDisplayTextSchema(300),
    observed: safeDisplayTextSchema(300).optional(),
    status: z.enum(["MATCH", "MISSING", "MISMATCH", "NOT_REQUIRED"]),
    sourceLabel: safeDisplayTextSchema(120).optional()
  }).strict()).min(1).max(12)
}).strict();

export const technicalStepSchema = z.object({
  stepId: opaqueIdSchema,
  stage: z.enum(["GEMINI", "GENKIT", "CLOUD_TASK", "ACTION", "INBOUND", "VERIFIER", "NOTIFICATION", "FIRESTORE"]),
  status: z.enum(["PENDING", "SUCCEEDED", "REJECTED", "FAILED", "MISSING"]),
  systemLabel: safeDisplayTextSchema(120),
  occurredAt: isoDateSchema.optional(),
  correlationSuffix: z.string().regex(/^[A-Za-z0-9_-]{4,16}$/).optional(),
  reasonCodes: z.array(z.string().min(1).max(100)).max(10)
}).strict();

export type MissionGoal = z.infer<typeof missionGoalSchema>;
export type ChannelType = z.infer<typeof channelTypeSchema>;
export type ChannelCapability = z.infer<typeof channelCapabilitySchema>;
export type ExecutionReceiptContract = z.infer<typeof actionReceiptSchema>;
export type MessageThread = z.infer<typeof messageThreadSchema>;
export type DeliveryEvent = z.infer<typeof deliveryEventSchema>;
export type ProviderEvent = z.infer<typeof providerEventSchema>;
export type InboundEnvelope = z.infer<typeof inboundEnvelopeSchema>;
export type OutcomeContract = z.infer<typeof outcomeContractSchema>;
export type ExecutionPlan = z.infer<typeof resolutionPlanSchema>;
export type AnalysisJob = z.infer<typeof analysisJobSchema>;
export type ConversationPlan = z.infer<typeof conversationPlanSchema>;
export type ActionEnvelope = z.infer<typeof actionEnvelopeSchema>;
export type ExecutionOutcomeContract = z.infer<typeof executionOutcomeSchema>;
export type IdentityClaim = z.infer<typeof identityClaimSchema>;
export type CaseSummaryContract = z.infer<typeof caseSummarySchema>;
export type ConversationEntry = z.infer<typeof conversationEntrySchema>;
export type OutcomeComparison = z.infer<typeof outcomeComparisonSchema>;
export type TechnicalStep = z.infer<typeof technicalStepSchema>;
