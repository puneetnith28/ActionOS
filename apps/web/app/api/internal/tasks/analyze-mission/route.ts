import { FirestoreAnalysisStore } from "@actionos/persistence/analysis-store";
import { FirestoreIntakeStore } from "@actionos/persistence/intake-store";
import { FirestoreTelemetryStore } from "@actionos/persistence/telemetry-store";
import { extractPromiseWithMetricsFlow } from "@actionos/genkit-flows/extract-promise";
import { IntakeService } from "@actionos/runtime/intake-service";
import { artifactBucket, firestore } from "../../../../../lib/firebase-admin";
import { PrivateArtifactStorage } from "../../../../../lib/artifact-storage";
import { handleAnalysisWorker } from "../../../../../lib/analysis-worker";
import { defaultIntakeChannel } from "../../../../../lib/intake-channel-policy";
import {
  modelBudgetKey,
  recordModelCallOutcome,
  reserveModelCallBudget
} from "../../../../../lib/security-limits";

export const runtime = "nodejs";

function intakeService(
  store: FirestoreIntakeStore,
  analysisStore: FirestoreAnalysisStore,
  telemetryStore: FirestoreTelemetryStore,
  jobId: string,
  requestedCorrelationId?: string
): IntakeService {
  const intakeChannel = defaultIntakeChannel();
  return new IntakeService(
    store,
    {
      async extract(artifact) {
        const budgetKey = modelBudgetKey(artifact.ownerId, artifact.artifactId);
        const observedAt = new Date().toISOString();
        await reserveModelCallBudget(firestore, budgetKey, artifact.ownerId, observedAt);
        const started = performance.now();
        try {
          const result = await extractPromiseWithMetricsFlow({
            artifactId: artifact.artifactId,
            source: typeof artifact.content === "string"
              ? { kind: "text", content: artifact.content }
              : { kind: "media", ...artifact.content }
          });
          await recordModelCallOutcome(firestore, budgetKey, {
            latencyMs: performance.now() - started,
            status: "SUCCEEDED",
            observedAt: new Date().toISOString(),
            usage: result.usage
          });
          const telemetryId = requestedCorrelationId ?? `corr_${jobId.slice(-24)}`;
          await telemetryStore.recordTelemetry({
            missionId: jobId,
            correlationId: telemetryId,
            occurredAt: new Date().toISOString(),
            kind: "MODEL_CALL",
            model: {
              modelId: "gemini-3.5-flash",
              latencyMs: performance.now() - started,
              promptTokens: result.usage?.inputTokens,
              completionTokens: result.usage?.outputTokens,
              totalTokens: result.usage?.totalTokens
            }
          });
          await analysisStore.markValidating(jobId, new Date().toISOString());
          return result.draft;
        } catch (error) {
          await recordModelCallOutcome(firestore, budgetKey, {
            latencyMs: performance.now() - started,
            status: "FAILED",
            observedAt: new Date().toISOString()
          });
          const telemetryId = requestedCorrelationId ?? `corr_${jobId.slice(-24)}`;
          await telemetryStore.recordTelemetry({
            missionId: jobId,
            correlationId: telemetryId,
            occurredAt: new Date().toISOString(),
            kind: "MODEL_CALL",
            model: { modelId: "gemini-3.5-flash", latencyMs: performance.now() - started },
            error: error instanceof Error ? error.message : "MODEL_CALL_FAILED"
          });
          throw error;
        }
      }
    },
    intakeChannel.recipient,
    undefined,
    intakeChannel.channel
  );
}

export async function POST(request: Request) {
  const intakeStore = new FirestoreIntakeStore(firestore);
  const analysisStore = new FirestoreAnalysisStore(firestore);
  const telemetryStore = new FirestoreTelemetryStore(firestore);
  
  const headerCorrelationId = request.headers.get("x-actionos-correlation-id") ?? undefined;
  
  return handleAnalysisWorker(request, {
    store: analysisStore,
    storage: new PrivateArtifactStorage(artifactBucket()),
    service: (jobId) => intakeService(intakeStore, analysisStore, telemetryStore, jobId, headerCorrelationId),
    now: () => new Date().toISOString()
  });
}
