import { FirestoreRuntimeStore } from "@dueback/persistence/runtime-store";
import { authenticatedOwner } from "../../../../../lib/authz";
import { firestore } from "../../../../../lib/firebase-admin";
import { handleCaseExport } from "../../../../../lib/export-controller";

export const runtime = "nodejs";
type Context = { params: Promise<{ caseId: string }> };

export async function GET(request: Request, context: Context) {
  const { caseId } = await context.params;
  return handleCaseExport(request, caseId, {
    authenticate: authenticatedOwner,
    store: new FirestoreRuntimeStore(firestore),
    now: () => new Date().toISOString()
  });
}
