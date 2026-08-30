import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { authenticatedOwner } from "../../../../../lib/authz";
import { firestore } from "../../../../../lib/firebase-admin";
import { handleMissionExport } from "../../../../../lib/export-controller";

export const runtime = "nodejs";
type Context = { params: Promise<{ missionId: string }> };

export async function GET(request: Request, context: Context) {
  const { missionId } = await context.params;
  return handleMissionExport(request, missionId, {
    authenticate: authenticatedOwner,
    store: new FirestoreRuntimeStore(firestore),
    now: () => new Date().toISOString()
  });
}
