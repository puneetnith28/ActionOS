import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { authenticatedOwner } from "../../../../../lib/authz";
import { handleCaseDetail } from "../../../../../lib/mission-detail-controller";
import { firestore } from "../../../../../lib/firebase-admin";

export const runtime = "nodejs";
type Context = { params: Promise<{ missionId: string }> };
export async function GET(request: Request, context: Context) {
  const { missionId } = await context.params;
  return handleCaseDetail(request, missionId, { authenticate: authenticatedOwner, store: new FirestoreRuntimeStore(firestore) });
}
