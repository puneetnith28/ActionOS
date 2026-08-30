import { FirestoreRuntimeStore } from "@actionos/persistence/runtime-store";
import { EvidenceService } from "@actionos/runtime/evidence-service";
import { handleMerchantCallback } from "../../../../lib/callback-controller";
import { firestore } from "../../../../lib/firebase-admin";
import { notificationDelivery } from "../../../../lib/notification-delivery";
import { caseScheduler } from "../../../../lib/case-scheduler";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.MERCHANT_CALLBACK_SECRET;
  if (!secret) return Response.json({ error: "CALLBACK_SECRET_NOT_CONFIGURED" }, { status: 503 });
  const store = new FirestoreRuntimeStore(firestore);
  return handleMerchantCallback(request, {
    secret,
    now: () => new Date().toISOString(),
    callbacks: store,
    evidence: new EvidenceService(
      store,
      store,
      store,
      notificationDelivery(store),
      caseScheduler()
    )
  });
}
