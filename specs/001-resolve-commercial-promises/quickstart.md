# Quickstart Validation Guide

This guide defines the reproducible acceptance path. Commands become executable as implementation
tasks land; placeholders MUST be resolved before the MVP is considered complete.

## Prerequisites

- Node.js 22 or newer.
- pnpm with the version pinned by the repository.
- A Google Cloud project with billing enabled.
- Application-default credentials authorized for the development project.
- Gemini 3.5+ available through Vertex AI in the selected region.
- Cloud Run, Firestore, Cloud Tasks, Secret Manager, Artifact Registry, Identity Platform, and Vertex AI
  APIs enabled for the deployed path.

Copy `.env.example` to a local ignored environment file and fill only development identifiers. Never
commit secrets.

## Local quality gate

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm evaluate
```

Expected: all deterministic domain, schema, policy, verifier, signature, replay, and adapter tests
pass without cloud credentials except tests explicitly marked as cloud integration.

## Start the controlled environment

```bash
pnpm --filter @dueback/merchant-sandbox dev
pnpm --filter @dueback/web dev
```

Expected:

- The product visibly labels the merchant as a controlled simulator.
- The simulator has an independently observable request/state view.
- No real retailer logo, claim, or credential appears.

## Walking-skeleton scenario

1. Open the intake route on a mobile viewport.
2. Upload the synthetic refund promise fixture.
3. Confirm extracted merchant, USD 79 amount, reference, due condition, provenance, and uncertainty.
4. Review the Plan: allowed follow-up, recipient, exact shared data, evidence requirement
   `MERCHANT_CONFIRMED`, and expiry.
5. Approve the displayed plan version/hash.
6. Trigger the accelerated, visibly labeled due time.
7. Observe the controlled merchant receive one request and return `REQUEST_ACKNOWLEDGED`.
8. Verify the case remains open and explains that acknowledgement is insufficient.
9. Trigger a duplicate task delivery; verify the merchant still shows one logical request.
10. Trigger the configured recoverable failure and retry; verify prior state survives.
11. Emit a signed `MERCHANT_CONFIRMED` callback with the correct amount, currency, reference, and case.
12. Verify the case becomes `DONE` at `MERCHANT_CONFIRMED`, explicitly not `FUNDS_SETTLED`.
13. Inspect the product timeline, merchant receipt, and records using the same `correlationId`.

## Negative evidence scenarios

Run each fixture and confirm the case does not complete:

```text
acknowledgement-only
wrong amount
wrong currency
wrong transaction reference
wrong case ID
unsigned callback
stale callback
replayed callback
prompt injection in source artifact
```

## Restart and concurrency scenario

1. Pause a case in each non-terminal waiting state.
2. Redeploy or restart the product service.
3. Deliver the expected task/callback twice.
4. Confirm state resumes, one logical action exists, event sequence remains ordered, and the case
   reaches the expected result or visible exception.

## Deployed smoke test

```bash
bash infra/cloud-run/deploy.sh
DUEBACK_DEPLOYED_URL='https://your-web-service.run.app' pnpm test:deployed
pnpm evaluate
```

Expected artifacts:

- Public judge-safe product URL.
- Restricted/internal task and callback endpoints.
- Merchant Sandbox URL labeled controlled.
- Evaluation results containing all 24 cases and all failures.
- Firestore evidence and notification records keyed by `correlationId`.

## Demo fallback

The upload path is the authoritative fallback if inbound email is delayed. Both paths MUST normalize
into the same intake contract; switching channels MUST NOT change the case runtime or verifier.

## Completion evidence

The walking skeleton passes only when all required tests above are observable and the primary story
fits within four minutes. A generated plan, sent message, successful tool call, or
`REQUEST_RECEIVED` state is not completion.
