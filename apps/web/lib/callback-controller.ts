import { executionOutcomeSchema } from "@actionos/contracts";
import { stableHash } from "@actionos/domain";
import { verifyCallbackSignature } from "@actionos/capabilities/callback-signature";
import type { VerificationService } from "@actionos/runtime/verification-service";

export interface CallbackRecordStore {
  reserveCallback(key: string, receivedAt: string): Promise<"RESERVED" | "IN_FLIGHT" | "COMPLETED">;
  completeCallback(key: string): Promise<void>;
  failCallback(key: string): Promise<void>;
}

export async function handleMerchantCallback(
  request: Request,
  dependencies: {
    secret: string;
    now: () => string;
    callbacks: CallbackRecordStore;
    verification: VerificationService;
  }
): Promise<Response> {
  const body = await request.text();
  const timestamp = request.headers.get("x-actionos-timestamp");
  const signature = request.headers.get("x-actionos-signature");
  const correlationId = request.headers.get("x-actionos-correlation-id") ?? undefined;
  const now = dependencies.now();
  if (!timestamp || !signature)
    return Response.json({ error: "CALLBACK_AUTH_REQUIRED" }, { status: 401 });
  const age = Math.abs(Date.parse(now) - Date.parse(timestamp)) / 1000;
  if (!Number.isFinite(age) || age > 300)
    return Response.json({ error: "STALE_CALLBACK" }, { status: 401 });
  if (!verifyCallbackSignature(body, timestamp, signature, dependencies.secret))
    return Response.json({ error: "INVALID_CALLBACK_SIGNATURE" }, { status: 401 });

  const key = stableHash({ namespace: "actionos/callback/v1", timestamp, signature, body });
  const reservation = await dependencies.callbacks.reserveCallback(key, now);
  if (reservation !== "RESERVED")
    return Response.json({ duplicate: true, status: reservation }, { status: 202 });
  try {
    const candidate = executionOutcomeSchema.parse({ ...JSON.parse(body), signatureValid: true });
    const result = correlationId
      ? await dependencies.evidence.verifyOutcome(candidate, now, correlationId)
      : await dependencies.evidence.verifyOutcome(candidate, now);
    await dependencies.callbacks.completeCallback(key);
    return Response.json(result, { status: result.status === "VERIFIED" ? 200 : 202 });
  } catch (error) {
    await dependencies.callbacks.failCallback(key);
    const message = error instanceof Error ? error.message : "CALLBACK_FAILED";
    const retryable = message === "VERSION_CONFLICT" || message === "EVIDENCE_NOT_ACCEPTED_IN_STATE";
    return Response.json(
      { error: retryable ? "CALLBACK_STATE_NOT_READY" : message },
      { status: retryable ? 409 : 422 }
    );
  }
}
