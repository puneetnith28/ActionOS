import { mkdir, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import { extractPromiseWithMetricsFlow } from "../../packages/genkit-flows/src/extract-promise.ts";
import {
  contradictoryPromise,
  hostilePromise,
  spanishRefundPromise,
  validRefundPromise
} from "../../packages/test-fixtures/src/promises.ts";

const fixtures = [validRefundPromise, spanishRefundPromise, contradictoryPromise, hostilePromise];
const startedAt = new Date().toISOString();
const results = [];

for (const fixture of fixtures) {
  const started = performance.now();
  try {
    const output = await extractPromiseWithMetricsFlow({
      artifactId: `live-${fixture.id}`,
      localeHint: fixture.locale,
      source: { kind: "text", content: fixture.content }
    });
    const draft = output.draft;
    const checks = {
      amountMinor: fixture.expected.amountMinor === undefined || draft.amountMinor?.value === fixture.expected.amountMinor,
      currency: fixture.expected.currency === undefined || draft.currency?.value === fixture.expected.currency,
      transactionRef: fixture.expected.transactionRef === undefined || draft.transactionRef.value === fixture.expected.transactionRef,
      provenance: [draft.promisor, draft.result, draft.transactionRef, draft.amountMinor, draft.currency]
        .filter(Boolean)
        .every((field) => field?.provenance.every((citation) => citation.artifactId === `live-${fixture.id}`)),
      hostileContentDidNotBecomeAuthority: draft.proposedEvidenceLevel !== "FUNDS_SETTLED"
    };
    results.push({
      fixtureId: fixture.id,
      passed: Object.values(checks).every(Boolean),
      checks,
      latencyMs: Math.round(performance.now() - started),
      usage: output.usage,
      uncertainty: {
        amountMinor: draft.amountMinor?.uncertainty,
        dueAt: draft.dueAt?.uncertainty,
        dueCondition: draft.dueCondition?.uncertainty
      }
    });
  } catch (error) {
    results.push({
      fixtureId: fixture.id,
      passed: false,
      latencyMs: Math.round(performance.now() - started),
      error: error instanceof Error ? error.message : "LIVE_MODEL_EVALUATION_FAILED"
    });
  }
}

const report = {
  evaluationType: "LIVE_GEMINI_EXTRACTION",
  model: "gemini-3.5-flash",
  location: process.env.GOOGLE_CLOUD_LOCATION ?? "global",
  startedAt,
  completedAt: new Date().toISOString(),
  modelCalls: fixtures.length,
  passed: results.filter((item) => item.passed).length,
  total: results.length,
  results
};

await mkdir("docs/evaluation", { recursive: true });
await writeFile("docs/evaluation/live-model-results.json", `${JSON.stringify(report, null, 2)}\n`);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.passed !== report.total) process.exitCode = 1;
