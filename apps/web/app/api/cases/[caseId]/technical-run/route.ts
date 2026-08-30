import { FirestoreRuntimeStore } from "@dueback/persistence/runtime-store";
import { authenticatedOwner } from "../../../../../lib/authz";
import { firestore } from "../../../../../lib/firebase-admin";
import { handleTechnicalRun } from "../../../../../lib/technical-run-controller";

export const runtime = "nodejs";
type Context = { params: Promise<{ caseId: string }> };

export async function GET(request: Request, context: Context) {
  const { caseId } = await context.params;
  return handleTechnicalRun(request, caseId, {
    authenticate: authenticatedOwner,
    store: new FirestoreRuntimeStore(firestore)
  });
}
