export interface TraceContext {
  readonly runId: string;
  readonly missionId: string;
  readonly correlationId: string;
  readonly actionId?: string;
}

export interface SafeEvent extends TraceContext {
  readonly event: string;
  readonly outcome: "STARTED" | "SUCCEEDED" | "REJECTED" | "FAILED";
  readonly reasonCode?: string;
  readonly durationMs?: number;
  readonly attempt?: number;
}

const forbiddenKeys = new Set([
  "address",
  "artifact",
  "artifactcontent",
  "body",
  "document",
  "email",
  "excerpt",
  "name",
  "prompt",
  "raw",
  "recipient",
  "replyroute",
  "sender",
  "sourcecontent",
  "subject",
  "text"
]);

function isSensitiveKey(key: string): boolean {
  const normalized = key.replace(/[^a-z0-9]/gi, "").toLowerCase();
  return forbiddenKeys.has(normalized) || normalized.includes("authorization") ||
    normalized.includes("secret") || normalized.includes("token") || normalized.includes("header") ||
    normalized.endsWith("body") || normalized.endsWith("text");
}

export function safeEvent(event: SafeEvent): Readonly<Record<string, string | number>> {
  const serialized = Object.fromEntries(
    Object.entries(event).filter(([, value]) => value !== undefined)
  ) as Record<string, string | number>;
  return Object.freeze(serialized);
}

export function redactUnknownFields(
  input: Readonly<Record<string, unknown>>
): Readonly<Record<string, string | number | boolean>> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(input)) {
    if (isSensitiveKey(key)) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      safe[key] = value;
    }
  }
  return Object.freeze(safe);
}

export * from "./telemetry";
