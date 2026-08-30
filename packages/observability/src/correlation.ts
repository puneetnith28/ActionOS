import { randomUUID } from "node:crypto";

export interface CorrelationContext {
  readonly correlationId: string;
  readonly caseId: string;
  readonly actionId?: string;
  readonly callbackId?: string;
}

export function correlationContext(caseId: string, existingId?: string): CorrelationContext {
  return { correlationId: existingId ?? `corr_${randomUUID()}`, caseId };
}
