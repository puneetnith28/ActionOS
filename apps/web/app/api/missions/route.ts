import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { FirestoreAnalysisStore } from "@actionos/persistence/analysis-store";
import { authenticatedOwner } from "../../../lib/authz";
import { handleMissions } from "../../../lib/missions-controller";
import { firestore } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleMissions(request, {
    authenticate: authenticatedOwner,
    store: new FirestoreRuntimeStore(firestore),
    analysisStore: new FirestoreAnalysisStore(firestore)
  });
}
