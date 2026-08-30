import { FirestoreRuntimeStore } from "@dueback/persistence/runtime-store";
import { FirestoreAnalysisStore } from "@dueback/persistence/analysis-store";
import { authenticatedOwner } from "../../../lib/authz";
import { handleCases } from "../../../lib/cases-controller";
import { firestore } from "../../../lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return handleCases(request, {
    authenticate: authenticatedOwner,
    store: new FirestoreRuntimeStore(firestore),
    analysisStore: new FirestoreAnalysisStore(firestore)
  });
}
