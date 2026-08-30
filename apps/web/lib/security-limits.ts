import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { stableHash } from "@dueback/domain";
import { firestoreDeleteAt } from "@dueback/persistence/expiry";

export const publicSecurityLimits = Object.freeze({
  newCasesPerIdentityPerDay: 10,
  modelCallsPerNormalCase: 4,
  taskAttemptsPerCase: 5,
  logicalExternalActionsPerCase: 3,
  notificationsPerCase: 3
});

export const gemini35FlashGlobalPricing = Object.freeze({
  inputUsdPerMillionTokens: 1.5,
  outputUsdPerMillionTokens: 9,
  observedOn: "2026-08-16",
  source: "https://cloud.google.com/gemini-enterprise-agent-platform/generative-ai/pricing"
});

export function modelBudgetKey(ownerId: string, artifactId: string): string {
  return `${ownerId}:${artifactId}`;
}

export function estimateGemini35FlashGlobalCost(input: {
  inputTokens?: number | undefined;
  outputTokens?: number | undefined;
}): number | null {
  if (input.inputTokens === undefined || input.outputTokens === undefined) return null;
  return Number(
    (
      (input.inputTokens * gemini35FlashGlobalPricing.inputUsdPerMillionTokens +
        input.outputTokens * gemini35FlashGlobalPricing.outputUsdPerMillionTokens) /
      1_000_000
    ).toFixed(8)
  );
}

export async function consumeNewCaseBudget(
  db: Firestore,
  ownerId: string,
  now: string
): Promise<void> {
  const day = now.slice(0, 10);
  const ownerHash = stableHash(ownerId).slice(7, 31);
  const reference = db.collection("securityBudgets").doc(`${ownerHash}-${day}`);
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(reference);
    const newCases = Number(current.get("newCases") ?? 0);
    if (newCases >= publicSecurityLimits.newCasesPerIdentityPerDay) {
      throw new Error("DAILY_CASE_BUDGET_EXHAUSTED");
    }
    transaction.set(
      reference,
      {
        ownerHash,
        day,
        newCases: newCases + 1,
        modelCalls: Number(current.get("modelCalls") ?? 0) + 1,
        updatedAt: now,
        expiresAt: new Date(Date.parse(now) + 2 * 86_400_000).toISOString(),
        deleteAt: firestoreDeleteAt(now, 2 * 86_400_000)
      },
      { merge: true }
    );
  });
}

export async function reserveModelCallBudget(
  db: Firestore,
  caseKey: string,
  ownerId: string,
  now: string
): Promise<void> {
  const reference = db.collection("modelUsage").doc(stableHash(caseKey).slice(7, 39));
  await db.runTransaction(async (transaction) => {
    const current = await transaction.get(reference);
    const callCount = Number(current.get("callCount") ?? 0);
    if (callCount >= publicSecurityLimits.modelCallsPerNormalCase) {
      throw new Error("MODEL_CALL_BUDGET_EXHAUSTED");
    }
    transaction.set(
      reference,
      {
        caseKeyHash: stableHash(caseKey),
        ownerHash: stableHash(ownerId),
        callCount: callCount + 1,
        updatedAt: now,
        deleteAt: firestoreDeleteAt(now)
      },
      { merge: true }
    );
  });
}

export async function recordModelCallOutcome(
  db: Firestore,
  caseKey: string,
  input: {
    latencyMs: number;
    status: "SUCCEEDED" | "FAILED";
    observedAt: string;
    usage?: {
      inputTokens?: number | undefined;
      outputTokens?: number | undefined;
      totalTokens?: number | undefined;
    };
  }
): Promise<void> {
  const inputTokens = input.usage?.inputTokens;
  const outputTokens = input.usage?.outputTokens;
  const estimatedCostUsd = estimateGemini35FlashGlobalCost({ inputTokens, outputTokens });
  await db
    .collection("modelUsage")
    .doc(stableHash(caseKey).slice(7, 39))
    .set(
      {
        totalLatencyMs: FieldValue.increment(Math.max(0, Math.round(input.latencyMs))),
        inputTokens: inputTokens ?? null,
        outputTokens: outputTokens ?? null,
        totalTokens: input.usage?.totalTokens ?? null,
        lastStatus: input.status,
        lastObservedAt: input.observedAt,
        estimatedCostUsd,
        costBasis:
          estimatedCostUsd === null
            ? "TOKEN_USAGE_UNAVAILABLE"
            : `STANDARD_GLOBAL_USD_PER_1M_INPUT_${String(gemini35FlashGlobalPricing.inputUsdPerMillionTokens)}_OUTPUT_${String(gemini35FlashGlobalPricing.outputUsdPerMillionTokens)}`,
        pricingObservedOn: gemini35FlashGlobalPricing.observedOn,
        pricingSource: gemini35FlashGlobalPricing.source,
        deleteAt: firestoreDeleteAt(input.observedAt)
      },
      { merge: true }
    );
}

export function assertLogicalActionBudget(actionOrdinal: number): void {
  if (
    !Number.isInteger(actionOrdinal) ||
    actionOrdinal < 1 ||
    actionOrdinal > publicSecurityLimits.logicalExternalActionsPerCase
  ) {
    throw new Error("LOGICAL_ACTION_BUDGET_EXHAUSTED");
  }
}

export function parseAllowedRecipientDomains(value: string | undefined): readonly string[] {
  if (!value) return [];
  return [...new Set(value.split(",").map((domain) => domain.trim().toLowerCase()).filter(Boolean))];
}

export function assertControlledRecipient(
  recipient: string,
  allowedDomains: readonly string[]
): void {
  const normalized = recipient.trim().toLowerCase();
  const separator = normalized.lastIndexOf("@");
  if (separator < 1 || separator === normalized.length - 1) {
    throw new Error("COMPANY_EMAIL_RECIPIENT_INVALID");
  }
  const domain = normalized.slice(separator + 1);
  if (allowedDomains.length === 0 || !allowedDomains.some((allowed) =>
    domain === allowed || domain.endsWith(`.${allowed}`)
  )) {
    throw new Error("COMPANY_EMAIL_RECIPIENT_NOT_ALLOWED");
  }
}

const safeErrors = new Set([
  "AUTHENTICATION_REQUIRED",
  "CASE_OWNERSHIP_REQUIRED",
  "DAILY_CASE_BUDGET_EXHAUSTED",
  "MODEL_CALL_BUDGET_EXHAUSTED",
  "LOGICAL_ACTION_BUDGET_EXHAUSTED",
  "COMPANY_EMAIL_RECIPIENT_INVALID",
  "COMPANY_EMAIL_RECIPIENT_NOT_ALLOWED",
  "FILE_TOO_LARGE",
  "UNSUPPORTED_MEDIA_TYPE",
  "MEDIA_TYPE_MISMATCH",
  "PROMISE_SOURCE_REQUIRED",
  "PROMISE_PLAN_INVALID",
  "CRITICAL_FIELDS_UNRESOLVED"
]);

export function redactedPublicError(error: unknown): string {
  if (error instanceof Error && error.name === "ZodError") return "PROMISE_PLAN_INVALID";
  const candidateCode =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : undefined;
  const message = candidateCode ?? (error instanceof Error ? error.message : "REQUEST_FAILED");
  return safeErrors.has(message) ? message : "REQUEST_FAILED";
}
