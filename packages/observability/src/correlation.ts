import { randomUUID } from "node:crypto";

export interface CorrelationContext {
  readonly correlationId: string;
  readonly missionId: string;
  readonly actionId?: string;
  readonly callbackId?: string;
}

export function correlationContext(missionId: string, existingId?: string): CorrelationContext {
  return { correlationId: existingId ?? `corr_${randomUUID()}`, missionId };
}
