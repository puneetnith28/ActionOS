# Feature 007 — Durable wake outbox

## Objective

Guarantee that every non-terminal state requiring future work retains a recoverable wake intention
even when Firestore succeeds and Cloud Tasks enqueue fails.

## Requirements

- The case transition and its `WakeIntent` MUST commit in the same Firestore transaction.
- A wake identity MUST be stable across retries and bind case, expected version and approved time.
- Immediate dispatch MUST remain idempotent through the stable Cloud Task name.
- Failed dispatch MUST leave the intent `PENDING`; it MUST never roll back an already durable case.
- A Google-OIDC-protected reconciler MUST scan bounded pending intents at least once per minute.
- A stale delivery MUST redispatch the current durable wake without repeating the external action.
- Activation, normal follow-up, adapter retry, insufficient evidence and `RESUME` MUST use the same
  contract.
- Repeated `RESUME` with the same idempotency key MUST retry dispatch rather than returning early.
- User-visible state MUST remain sourced from the case; outbox internals are redacted technical
  evidence, not a consumer control surface.

## Acceptance

1. Inject enqueue failure after a successful state transition.
2. Observe the case in its new version with one pending intent.
3. Retry/reconcile and create exactly one stable Cloud Task.
4. Confirm the external action was not repeated by recovery.
5. Complete the public winning path after deployment.
6. Reject unauthenticated calls to the reconciler with HTTP 401.
