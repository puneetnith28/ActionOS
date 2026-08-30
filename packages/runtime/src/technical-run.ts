import { technicalStepSchema, type TechnicalStep } from "@actionos/contracts";
import type { EvidenceRecord } from "./verification-service";
import type { NotificationRecord } from "./notifications";
import type { RuntimeTimelineEvent } from "./timeline";

export interface TechnicalRunSource {
  modelUsage?: {
    lastStatus?: "SUCCEEDED" | "FAILED";
    lastObservedAt?: string;
    totalLatencyMs?: number;
    totalTokens?: number;
    estimatedCostUsd?: number;
  };
  hasTypedDraft: boolean;
  events: readonly RuntimeTimelineEvent[];
  verification: readonly EvidenceRecord[];
  notifications: readonly NotificationRecord[];
  channelEvents: readonly { transportStatus: string; acceptedAt: string; observedAt?: string }[];
}

function suffix(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const clean = value.replace(/[^A-Za-z0-9_-]/g, "");
  return clean.length >= 4 ? clean.slice(-12) : undefined;
}

export function technicalRunProjection(source: TechnicalRunSource): TechnicalStep[] {
  const steps: TechnicalStep[] = [];
  steps.push(technicalStepSchema.parse({
    stepId: "step_gemini_extraction",
    stage: "GEMINI",
    status: source.modelUsage?.lastStatus ?? "MISSING",
    systemLabel: source.modelUsage
      ? [
          "Gemini typed extraction call",
          source.modelUsage.totalLatencyMs === undefined ? undefined : `${String(source.modelUsage.totalLatencyMs)} ms`,
          source.modelUsage.totalTokens === undefined ? undefined : `${String(source.modelUsage.totalTokens)} tokens`,
          source.modelUsage.estimatedCostUsd === undefined
            ? undefined
            : `$${source.modelUsage.estimatedCostUsd.toFixed(6)} estimated`
        ].filter(Boolean).join(" · ")
      : "Gemini telemetry unavailable",
    ...(source.modelUsage?.lastObservedAt ? { occurredAt: source.modelUsage.lastObservedAt } : {}),
    reasonCodes: source.modelUsage ? [] : ["MODEL_TELEMETRY_MISSING"]
  }));
  steps.push(technicalStepSchema.parse({
    stepId: "step_genkit_contract",
    stage: "GENKIT",
    status: source.hasTypedDraft ? "SUCCEEDED" : "MISSING",
    systemLabel: source.hasTypedDraft ? "Typed promise contract persisted" : "Typed contract unavailable",
    reasonCodes: source.hasTypedDraft ? [] : ["TYPED_DRAFT_MISSING"]
  }));
  for (const event of source.events) {
    steps.push(technicalStepSchema.parse({
      stepId: `step_event_${String(event.sequence)}`,
      stage: event.type === "ACTION_RESULT" ? "CLOUD_TASK" : "FIRESTORE",
      status: event.state === "FAILED" ? "FAILED" : "SUCCEEDED",
      systemLabel: event.type === "ACTION_RESULT" ? "Durable worker result persisted" : "Case transition persisted",
      occurredAt: event.occurredAt,
      ...(suffix(event.correlationId) ? { correlationSuffix: suffix(event.correlationId) } : {}),
      reasonCodes: [...event.reasonCodes].slice(0, 10)
    }));
  }
  for (const [index, action] of source.channelEvents.entries()) {
    steps.push(technicalStepSchema.parse({
      stepId: `step_action_${String(index + 1)}`,
      stage: "ACTION",
      status: ["FAILED", "BOUNCED", "SUPPRESSED", "COMPLAINED"].includes(action.transportStatus) ? "FAILED" : "SUCCEEDED",
      systemLabel: "External transport receipt",
      occurredAt: action.observedAt ?? action.acceptedAt,
      reasonCodes: [`TRANSPORT_${action.transportStatus}`]
    }));
  }
  for (const record of source.evidence) {
    steps.push(technicalStepSchema.parse({
      stepId: `step_verify_${record.candidate.outcomeId.slice(-16)}`,
      stage: "VERIFIER",
      status: record.verification.accepted ? "SUCCEEDED" : "REJECTED",
      systemLabel: "Deterministic evidence policy",
      occurredAt: record.recordedAt,
      ...(suffix(record.correlationId) ? { correlationSuffix: suffix(record.correlationId) } : {}),
      reasonCodes: [...record.verification.reasonCodes].slice(0, 10)
    }));
  }
  for (const notification of source.notifications) {
    steps.push(technicalStepSchema.parse({
      stepId: `step_notify_${notification.notificationId.slice(-16)}`,
      stage: "NOTIFICATION",
      status: ["FAILED", "BOUNCED", "SUPPRESSED"].includes(notification.deliveryStatus ?? "") ? "FAILED" : "SUCCEEDED",
      systemLabel: "Owner return notification",
      occurredAt: notification.lastAttemptAt ?? notification.createdAt,
      ...(suffix(notification.correlationId) ? { correlationSuffix: suffix(notification.correlationId) } : {}),
      reasonCodes: [`DELIVERY_${notification.deliveryStatus ?? "RECORDED"}`]
    }));
  }
  return steps.sort((left, right) => (left.occurredAt ?? "").localeCompare(right.occurredAt ?? ""));
}
