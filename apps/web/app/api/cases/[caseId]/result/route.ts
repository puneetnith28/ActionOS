import { FirestoreRuntimeStore } from "@dueback/persistence/runtime-store";
import { authenticatedOwner } from "../../../../../lib/authz";
import { firestore } from "../../../../../lib/firebase-admin";
import { handleCaseResult } from "../../../../../lib/result-controller";

export const runtime = "nodejs";
type Context = { params: Promise<{ caseId: string }> };

export async function GET(request: Request, context: Context) {
  const { caseId } = await context.params;
  return handleCaseResult(request, caseId, {
    authenticate: authenticatedOwner,
    store: new FirestoreRuntimeStore(firestore)
  });
}
