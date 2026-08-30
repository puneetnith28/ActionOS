import { FirestoreRuntimeStore } from "@dueback/persistence/runtime-store";
import { authenticatedOwner } from "../../../../../lib/authz";
import { handleCaseDetail } from "../../../../../lib/case-detail-controller";
import { firestore } from "../../../../../lib/firebase-admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ caseId: string }> };
export async function GET(request: Request, context: Context) {
  const { caseId } = await context.params;
  return handleCaseDetail(request, caseId, { authenticate: authenticatedOwner, store: new FirestoreRuntimeStore(firestore) });
}
