import { FirestoreAnalysisStore } from "@dueback/persistence/analysis-store";
import { FirestoreIntakeStore } from "@dueback/persistence/intake-store";
import { extractPromiseWithMetricsFlow } from "@dueback/genkit-flows/extract-promise";
import { IntakeService } from "@dueback/runtime/intake-service";
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
  jobId: string
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
          await analysisStore.markValidating(jobId, new Date().toISOString());
          return result.draft;
        } catch (error) {
          await recordModelCallOutcome(firestore, budgetKey, {
            latencyMs: performance.now() - started,
            status: "FAILED",
            observedAt: new Date().toISOString()
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
  return handleAnalysisWorker(request, {
    store: analysisStore,
    storage: new PrivateArtifactStorage(artifactBucket()),
    service: (jobId) => intakeService(intakeStore, analysisStore, jobId),
    now: () => new Date().toISOString()
  });
}
