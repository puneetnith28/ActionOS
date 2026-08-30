import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { authenticatedOwner } from "../../../../../../lib/authz";
import { firestore } from "../../../../../../lib/firebase-admin";
import { notificationDelivery } from "../../../../../../lib/notification-delivery";
import { handleNotificationRetry } from "../../../../../../lib/notification-controller";

export const runtime = "nodejs";
type Context = { params: Promise<{ missionId: string }> };

export async function POST(request: Request, context: Context) {
  const { missionId } = await context.params;
  const store = new FirestoreRuntimeStore(firestore);
  return handleNotificationRetry(request, missionId, {
    authenticate: authenticatedOwner,
    store,
    delivery: notificationDelivery(store)
  });
}
