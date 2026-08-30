import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { authenticatedOwner } from "../../../../../lib/authz";
import { firestore } from "../../../../../lib/firebase-admin";
import { handleMissionResult } from "../../../../../lib/result-controller";

export const runtime = "nodejs";
type Context = { params: Promise<{ missionId: string }> };

export async function GET(request: Request, context: Context) {
  const { missionId } = await context.params;
  return handleMissionResult(request, missionId, {
    authenticate: authenticatedOwner,
    store: new FirestoreRuntimeStore(firestore)
  });
}
