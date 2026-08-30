import { stableHash } from "@actionos/domain";

export interface WakeIntent {
  readonly intentId: string;
  readonly missionId: string;
  readonly expectedVersion: number;
  readonly wakeAt: string;
  readonly correlationId?: string;
  readonly status: "PENDING" | "DISPATCHED";
  readonly attemptCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastError?: string;
  readonly taskName?: string;
}

export function wakeIntent(input: {
  missionId: string;
  expectedVersion: number;
  wakeAt: string;
  correlationId?: string;
  createdAt: string;
}): WakeIntent {
  const intentId = stableHash({
    namespace: "dueback/wake-intent/v1",
    missionId: input.missionId,
    expectedVersion: input.expectedVersion,
    wakeAt: input.wakeAt
  }).slice(7, 39);
  return {
    intentId,
    missionId: input.missionId,
    expectedVersion: input.expectedVersion,
    wakeAt: input.wakeAt,
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
    status: "PENDING",
    attemptCount: 0,
    createdAt: input.createdAt,
    updatedAt: input.createdAt
  };
}

export interface WakeOutboxStore {
  listPending(limit: number): Promise<readonly WakeIntent[]>;
  markDispatched(intentId: string, taskName: string, observedAt: string): Promise<void>;
  markFailed(intentId: string, reason: string, observedAt: string): Promise<void>;
}

export interface WakeTaskScheduler {
  scheduleCase(input: {
    missionId: string;
    expectedVersion: number;
    wakeAt: string;
    correlationId?: string;
  }): Promise<{ taskName: string; duplicate: boolean }>;
}

export class DurableWakeScheduler implements WakeTaskScheduler {
  constructor(
    private readonly tasks: WakeTaskScheduler,
    private readonly outbox: WakeOutboxStore,
    private readonly now: () => string
  ) {}

  async scheduleCase(input: {
    missionId: string;
    expectedVersion: number;
    wakeAt: string;
    correlationId?: string;
  }): Promise<{ taskName: string; duplicate: boolean }> {
    const intent = wakeIntent({ ...input, createdAt: this.now() });
    try {
      const result = await this.tasks.scheduleCase(input);
      await this.outbox.markDispatched(intent.intentId, result.taskName, this.now());
      return result;
    } catch (error) {
      await this.outbox.markFailed(
        intent.intentId,
        error instanceof Error ? error.message : "WAKE_DISPATCH_FAILED",
        this.now()
      );
      throw error;
    }
  }

  async reconcile(limit = 25): Promise<{ dispatched: number; failed: number }> {
    const pending = await this.outbox.listPending(limit);
    let dispatched = 0;
    let failed = 0;
    for (const intent of pending) {
      try {
        await this.scheduleCase({
          missionId: intent.missionId,
          expectedVersion: intent.expectedVersion,
          wakeAt: intent.wakeAt,
          ...(intent.correlationId ? { correlationId: intent.correlationId } : {})
        });
        dispatched += 1;
      } catch {
        failed += 1;
      }
    }
    return { dispatched, failed };
  }
}
