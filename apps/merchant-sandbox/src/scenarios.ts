export type ScenarioName =
  | "acknowledgement"
  | "retry-once"
  | "mismatch"
  | "signed-completion"
  | "replay"
  | "latency";

export interface ScenarioStep {
  readonly status: number;
  readonly outcome: "ACTION_ATTEMPTED" | "OUTCOME_CONFIRMED";
  readonly mismatch?: "amount" | "reference";
  readonly delayMs?: number;
  readonly replayCount?: number;
  readonly followupOutcome?: "OUTCOME_CONFIRMED";
  readonly followupDelayMs?: number;
}

export const merchantScenarios: Readonly<Record<ScenarioName, readonly ScenarioStep[]>> = {
  acknowledgement: [{ status: 202, outcome: "ACTION_ATTEMPTED" }],
  "retry-once": [
    { status: 503, outcome: "ACTION_ATTEMPTED" },
    { status: 202, outcome: "ACTION_ATTEMPTED" },
    { status: 200, outcome: "OUTCOME_CONFIRMED" }
  ],
  mismatch: [{ status: 200, outcome: "OUTCOME_CONFIRMED", mismatch: "reference" }],
  "signed-completion": [
    {
      status: 202,
      outcome: "ACTION_ATTEMPTED",
      followupOutcome: "OUTCOME_CONFIRMED",
      followupDelayMs: 8_000
    }
  ],
  replay: [{ status: 200, outcome: "OUTCOME_CONFIRMED", replayCount: 2 }],
  latency: [{ status: 200, outcome: "OUTCOME_CONFIRMED", delayMs: 250 }]
};

export function scenarioStep(name: ScenarioName, attempt: number): ScenarioStep {
  const steps = merchantScenarios[name];
  const step = steps[Math.min(Math.max(attempt - 1, 0), steps.length - 1)];
  if (!step) throw new Error("SCENARIO_HAS_NO_STEPS");
  return step;
}
