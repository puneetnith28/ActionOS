# Quickstart: Validate the Consumer Case Inbox

## Prerequisites

- Node 22, Corepack and pnpm 10.34.5.
- Existing local configuration from the root README.
- Firebase Auth anonymous and Google providers for cross-device tests.
- Firestore Emulator for ownership/rules tests.
- Controlled Resend credentials only for the opt-in deployed smoke; never commit them.

## Install and baseline

```bash
corepack enable
corepack prepare pnpm@10.34.5 --activate
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
```

## Kill gate 1 — Product truth

Run the channel projection tests. A managed-email fixture must contain no Merchant Sandbox or
signed-callback consumer copy; sandbox fixtures must retain their disclosure.

```bash
pnpm exec vitest run apps/web/test/case-projection.test.ts
```

## Kill gate 2 — Identity and inbox

Before running this gate, confirm in Firebase Authentication that the Google provider is enabled and
that the exact public hostname is an authorized domain. On 2026-08-17 Google sign-in was enabled and
Firebase Hosting `bulbasour-503317.web.app` was placed in front of Cloud Run because Firebase correctly
rejects the shared `run.app` suffix as an authorized OAuth domain. Provider configuration and page
delivery are verified; cross-device recovery remains a claim gate until the two-browser journey below
passes with a real linked case.

Run emulator tests for anonymous linking, explicit draft claim, cross-owner denial and paginated
owner history, then the two-browser journey.

```bash
pnpm test:firestore-rules
pnpm exec playwright test tests/e2e/cross-device-return.spec.ts --workers=1 --retries=0
```

Expected: the clean browser sees the same owned case after sign-in; a second identity receives no
case facts; concurrent linking produces one owner and one case.

Capture the real Google-linked browser state without sharing credentials or committing tokens:

```bash
DUEBACK_DEPLOYED_URL='https://bulbasour-503317.web.app' pnpm release:capture-google
```

The command opens a headed browser and waits up to five minutes for the participant to finish Google
sign-in. It saves Firebase cookies/local storage/IndexedDB under ignored `.auth/`. After creating one
case in that authenticated browser, run the gate with its case ID:

```bash
DUEBACK_DEPLOYED_URL='https://bulbasour-503317.web.app' \
DUEBACK_OWNER_STORAGE_STATE='.auth/google-owner.json' \
DUEBACK_CROSS_DEVICE_CASE_ID='case_...' \
pnpm exec playwright test tests/e2e/cross-device-return.spec.ts --workers=1 --retries=0
```

## Kill gate 3 — Conversation and false-DONE

```bash
pnpm exec vitest run tests/integration/consumer-case-detail.test.ts tests/adversarial/email-inbound.test.ts
```

Expected: “request received” remains unresolved and names missing facts; explicit sufficient reply
populates Promised versus Observed; no observed fact is copied from the plan.

## Kill gate 4 — Durable return

```bash
pnpm exec vitest run tests/integration/attention-notification.test.ts packages/runtime/test/notifications.test.ts
```

Expected: intervention, replay and concurrent delivery create one logical notification and at most
one provider send; accepted/delivered/bounced states remain distinct.

## Kill gate 5 — Complete browser and accessibility journey

```bash
pnpm exec playwright test tests/e2e/consumer-case-inbox.spec.ts tests/e2e/accessibility.spec.ts --workers=1 --retries=0
```

Expected: mobile inbox → email case → weak proof → needs-you notification → sufficient proof → exact
result; keyboard, announcements, reduced motion and 200% reflow pass.

## Opt-in controlled pilot smoke

Run only with owned allowlisted mailboxes and a verified provider webhook. Record redacted provider
IDs, deployed Cloud Run revision and timestamps. Never place addresses, API keys or message bodies in
committed output.

```bash
DUEBACK_DEPLOYED_URL='https://your-project.web.app' \
DUEBACK_EMAIL_E2E='1' \
pnpm exec playwright test tests/e2e/deployed-managed-email.spec.ts --workers=1 --retries=0
```

## Full release gate

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm evaluate
git diff --check
```

The feature is not complete until the deployed continuous demo can close the browser, process an
email reply, reject weak proof, notify the owner and recover the same case through “My follow-ups”.
