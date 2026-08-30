export interface ModelTelemetry {
  readonly modelId: string;
  readonly promptTokens?: number | undefined;
  readonly completionTokens?: number | undefined;
  readonly totalTokens?: number | undefined;
  readonly latencyMs: number;
}

export interface CapabilityTelemetry {
  readonly capabilityId: string;
  readonly status: "SUCCEEDED" | "FAILED";
  readonly latencyMs: number;
  readonly reasonCode?: string;
}

export interface ExecutionTelemetry {
  readonly missionId: string;
  readonly correlationId: string;
  readonly occurredAt: string;
  readonly kind: "MODEL_CALL" | "CAPABILITY_EXEC" | "MISSION_LIFECYCLE";
  readonly model?: ModelTelemetry;
  readonly capability?: CapabilityTelemetry;
  readonly lifecycle?: {
    readonly fromState: string;
    readonly toState: string;
  };
  readonly error?: string;
}

export interface TelemetryStore {
  recordTelemetry(telemetry: ExecutionTelemetry): Promise<void>;
  listTelemetry(missionId: string, limit?: number): Promise<readonly ExecutionTelemetry[]>;
}
