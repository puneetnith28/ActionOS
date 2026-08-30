# Quickstart: Winning Product Loop Validation

This guide validates behavior; implementation details belong in [tasks.md](./tasks.md).

## Prerequisites

```bash
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
```

Use synthetic fixtures only. Copy `.env.example` to an ignored local environment file. Do not add
provider secrets to the repository.

## Gate A — False-DONE safety

Run the inbound/verifier contract and adversarial suites first:

```bash
pnpm --filter @actionos/runtime test
pnpm --filter @actionos/domain test
pnpm exec vitest run tests/adversarial tests/contract/email-inbound.test.ts
```

Required outcome: replies missing amount, currency, reference, subject or tracking remain missing and
cannot close their corresponding cases. Unexpected sender/thread and acknowledgements remain open.

## Gate B — Durable analysis

Run the Firestore emulator/integration paths for:

- accepted intake returns `ANALYZING` promptly;
- refresh/close reads the persisted stage;
- first model failure retries the same job;
- duplicate task does not publish twice;
- cancellation wins against late model completion;
- schema/input failures preserve an actionable safe state.

```bash
pnpm exec vitest run tests/integration/durable-analysis.test.ts tests/adversarial/analysis-races.test.ts
pnpm --filter @actionos/web test
```

## Gate C — Compact editable review

```bash
pnpm exec playwright test tests/e2e/editable-review.spec.ts tests/e2e/intake-resilience.spec.ts \
  --workers=1 --retries=0
```

Correct an amount/date, confirm the plan version changes, use only keyboard controls, preview without
external action and prove stale approval cannot execute.

## Gate D — Accelerated production loop

Deploy sandbox mode. Keep real email disabled. Then run:

```bash
ACTIONOS_DEPLOYED_URL='https://your-service.run.app' \
  pnpm exec playwright test tests/e2e/deployed-example-matrix.spec.ts \
  --workers=1 --retries=0
```

Every visible example must proceed beyond review to an inspectable terminal/actionable result. The
timeline must show persisted action, weak response, verification reason and final exact claim. Demo
acceleration must be labeled.

## Gate E — Recoverable return

Use Firebase Auth Emulator locally and two clean browser contexts:

1. Create a draft anonymously.
2. Link/sign in with the recoverable test provider before activation.
3. Close the first browser.
4. Open the deep link in the second browser, authenticate and inspect the same owned case.
5. Attempt another owner's case and verify denial.

Run Firestore rules plus Playwright ownership tests. Do not use production personal accounts in CI.

## Gate F — Evidence Console and live Gemini

For an owned synthetic accelerated case, verify the console shows persisted model/task/action/
receipt/verifier metadata and contains none of: raw prompt, artifact, email address, webhook signature
or token.

Run the opt-in live evaluation only with Google Cloud credentials:

```bash
GOOGLE_CLOUD_PROJECT='your-project-id' pnpm evaluate:live
```

The output must retain all attempted cases and report model/config/date, latency, usage, estimated
cost and failures separately from `pnpm evaluate`.

## Gate G — Optional controlled email

Do not run until Gate A passes. Configure one verified sender/reply domain and exactly controlled
recipient domains through Secret Manager/deployment configuration. Prove:

1. outbound receipt;
2. signed inbound reservation;
3. exact case/thread correlation;
4. incomplete reply rejected without fallback;
5. complete reply accepted only at the supported evidence level;
6. readiness record matches current revision/configuration and has not expired.

Rollback to sandbox on any failure. A failed email gate must not block the public sandbox path.

## Gate H — Full release

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm evaluate
pnpm release:check
git diff --check
```

Then execute the sequential deployed suite with retries disabled, rehearse the continuous four-minute
script, verify repository access from a clean account, and manually confirm external Devpost/eligibility
gates. Targets are not results until their artifacts exist.
