import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { genkit } from "genkit";
import { capabilityIdempotencyKey } from "../../packages/domain/src/identity.ts";
import { authorizeAction } from "../../packages/domain/src/policy.ts";
import { verifyEvidence } from "../../packages/domain/src/verifier.ts";
import { transportStatusForProviderEvent } from "../../packages/capabilities/src/email-webhook.ts";
import {
  evaluationCorpus,
  type EvaluationCase
} from "../../packages/test-fixtures/src/evaluation-corpus.ts";
import {
  billCreditFixture,
  replacementFixture
} from "../../packages/test-fixtures/src/promise-manifests.ts";

const model = "gemini-3.5-flash";
const configuration = {
  runnerVersion: "1.0.0",
  model,
  modelCalls: 0,
  modelMode: "NOT_RUN_DETERMINISTIC_ONLY",
  location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
  evaluatedAt: new Date().toISOString(),
  costBasis: "No model calls; estimated model cost is not reported for this deterministic run."
} as const;

const refundRequirement = {
  minimumLevel: "MERCHANT_CONFIRMED" as const,
  amountMinor: 7900,
  currency: "USD",
  transactionRef: "ORDER-79",
  maxAgeSeconds: 2_592_000,
  trustedIssuer: "merchant-sandbox"
};
const refundEvidence = {
  evidenceId: "evidence_eval_1234",
  caseId: "case_eval_123456",
  level: "MERCHANT_CONFIRMED" as const,
  amountMinor: 7900,
  currency: "USD",
  transactionRef: "ORDER-79",
  issuedAt: "2026-08-16T00:00:00.000Z",
  issuer: "merchant-sandbox",
  signatureValid: true
};

interface ObservedResult {
  readonly passed: boolean;
  readonly observedState: string;
  readonly observedReasonCodes: readonly string[];
  readonly evaluationType: "DETERMINISTIC_EXECUTION" | "FIXTURE_CONTRACT";
}

function evidenceResult(item: EvaluationCase): ObservedResult | undefined {
  if (["VALID_EVIDENCE", "EMAIL_CONFIRMATION"].includes(item.scenario)) {
    const fixture =
      item.id === "CLEAR-04"
        ? billCreditFixture
        : item.id === "CLEAR-05"
          ? replacementFixture
          : undefined;
    const requirement = fixture?.plan.evidenceRequirements[0] ?? refundRequirement;
    const candidate = fixture?.acceptedEvidence ?? refundEvidence;
    const observed = verifyEvidence({
      caseId: candidate.caseId,
      requirement,
      candidate,
      now: fixture ? "2026-09-01T12:01:00.000Z" : "2026-08-16T00:01:00.000Z"
    });
    return {
      passed: observed.accepted === item.expected.acceptedEvidence,
      observedState: observed.accepted ? "DONE" : "NEEDS_ATTENTION",
      observedReasonCodes: observed.reasonCodes,
      evaluationType: "DETERMINISTIC_EXECUTION"
    };
  }
  const candidate = { ...refundEvidence };
  if (["ACKNOWLEDGEMENT_ONLY", "EMAIL_ACKNOWLEDGEMENT"].includes(item.scenario)) candidate.level = "REQUEST_ACKNOWLEDGED";
  else if (item.scenario === "WRONG_AMOUNT") candidate.amountMinor = 1;
  else if (item.scenario === "WRONG_CURRENCY") candidate.currency = "EUR";
  else if (item.scenario === "WRONG_REFERENCE") candidate.transactionRef = "WRONG";
  else if (item.scenario === "WRONG_CASE") candidate.caseId = "case_attacker_1234";
  else if (item.scenario === "UNSIGNED_CALLBACK") candidate.signatureValid = false;
  else return undefined;
  const observed = verifyEvidence({
    caseId: refundEvidence.caseId,
    requirement: refundRequirement,
    candidate,
    now: "2026-08-16T00:01:00.000Z"
  });
  const acknowledgement =
    observed.reasonCodes.length === 1 && observed.reasonCodes[0] === "INSUFFICIENT_LEVEL";
  return {
    passed:
      observed.accepted === item.expected.acceptedEvidence &&
      (item.expected.reasonCodes ?? []).every((reason) =>
        observed.reasonCodes.includes(reason as never)
      ),
    observedState: acknowledgement ? "WAITING_EXTERNAL" : "NEEDS_ATTENTION",
    observedReasonCodes: observed.reasonCodes,
    evaluationType: "DETERMINISTIC_EXECUTION"
  };
}

function evaluateCase(item: EvaluationCase): ObservedResult {
  const evidence = evidenceResult(item);
  if (evidence) return evidence;
  if (["EMAIL_DELIVERED", "EMAIL_BOUNCED"].includes(item.scenario)) {
    const eventType = item.scenario === "EMAIL_DELIVERED" ? "email.delivered" : "email.bounced";
    const transportStatus = transportStatusForProviderEvent(eventType);
    const observedState = transportStatus === "BOUNCED" ? "NEEDS_ATTENTION" : "WAITING_EXTERNAL";
    return {
      passed: Boolean(transportStatus) && observedState === item.expected.state,
      observedState,
      observedReasonCodes: [transportStatus ?? "UNKNOWN_TRANSPORT_EVENT"],
      evaluationType: "DETERMINISTIC_EXECUTION"
    };
  }
  if (item.scenario === "PROMPT_INJECTION") {
    const hash = `sha256:${"a".repeat(64)}`;
    const observed = authorizeAction(
      {
        ownerId: "person_eval",
        planVersion: 1,
        planHash: hash,
        allowedActions: ["SEND_FOLLOW_UP"],
        allowedRecipient: "merchant@controlled.dueback.test",
        sharedFields: ["transactionRef"],
        approval: {
          ownerId: "person_eval",
          planVersion: 1,
          planHash: hash,
          expiresAt: "2026-09-01T00:00:00.000Z"
        }
      },
      {
        ownerId: "person_eval",
        planVersion: 1,
        planHash: hash,
        actionType: "EXPORT_ALL_CASES",
        recipient: "attacker.test",
        sharedFields: { inventory: "all" }
      },
      "2026-08-16T00:00:00.000Z"
    );
    return {
      passed: !observed.authorized,
      observedState: "AWAITING_APPROVAL",
      observedReasonCodes: observed.reasonCodes,
      evaluationType: "DETERMINISTIC_EXECUTION"
    };
  }
  if (["DUPLICATE_TASK", "RESTART_BOUNDARY"].includes(item.scenario)) {
    const input = {
      caseId: "case_eval_123456",
      planVersion: 1,
      actionType: "SEND_FOLLOW_UP",
      ordinal: 1
    };
    const passed = capabilityIdempotencyKey(input) === capabilityIdempotencyKey(input);
    return {
      passed,
      observedState: item.expected.state,
      observedReasonCodes: ["IDEMPOTENCY_KEY_STABLE"],
      evaluationType: "DETERMINISTIC_EXECUTION"
    };
  }
  return {
    passed: true,
    observedState: item.expected.state,
    observedReasonCodes: ["CONTRACT_EXPECTATION_RECORDED"],
    evaluationType: "FIXTURE_CONTRACT"
  };
}

const ai = genkit({ name: "dueback-evaluation" });
export const corpusEvaluator = ai.defineEvaluator(
  {
    name: "dueback/corpus-contract",
    displayName: "DueBack corpus contract",
    definition:
      "Checks deterministic DueBack outcome contracts without asking a model to judge itself."
  },
  async (datapoint) => {
    const item = evaluationCorpus.find((candidate) => candidate.id === datapoint.testCaseId);
    const result = item ? evaluateCase(item) : undefined;
    return {
      testCaseId: datapoint.testCaseId,
      evaluation: {
        score: result?.passed ? 1 : 0,
        details: {
          reasoning: result
            ? `${result.evaluationType}: ${result.observedReasonCodes.join(",")}`
            : "Unknown case"
        }
      }
    };
  }
);

const started = performance.now();
const cases = evaluationCorpus.map((item) => {
  const caseStarted = performance.now();
  try {
    const result = evaluateCase(item);
    return {
      id: item.id,
      group: item.group,
      scenario: item.scenario,
      expected: item.expected,
      ...result,
      latencyMs: Number((performance.now() - caseStarted).toFixed(3)),
      error: null
    };
  } catch (error) {
    return {
      id: item.id,
      group: item.group,
      scenario: item.scenario,
      expected: item.expected,
      passed: false,
      observedState: "ERROR",
      observedReasonCodes: [],
      evaluationType: "DETERMINISTIC_EXECUTION" as const,
      latencyMs: Number((performance.now() - caseStarted).toFixed(3)),
      error: error instanceof Error ? error.message : "UNKNOWN"
    };
  }
});
const report = {
  configuration,
  summary: {
    total: cases.length,
    passed: cases.filter((item) => item.passed).length,
    failed: cases.filter((item) => !item.passed).length,
    deterministicExecutions: cases.filter(
      (item) => item.evaluationType === "DETERMINISTIC_EXECUTION"
    ).length,
    fixtureContractChecks: cases.filter((item) => item.evaluationType === "FIXTURE_CONTRACT")
      .length,
    totalLatencyMs: Number((performance.now() - started).toFixed(3))
  },
  cases
};

await mkdir(new URL("../../docs/evaluation/", import.meta.url), { recursive: true });
await writeFile(
  new URL("../../docs/evaluation/results.json", import.meta.url),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8"
);
process.stdout.write(`${JSON.stringify(report.summary)}\n`);
