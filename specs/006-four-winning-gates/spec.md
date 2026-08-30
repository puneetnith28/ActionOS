# Feature 006 — Four winning gates

## Objective

Close the four issues found by the pre-video jury audit without adding channels or recipes.

## Gate 1 — Authenticated durable workers

- Every internal Cloud Tasks route MUST validate a Google-signed OIDC bearer token.
- Validation MUST bind the configured audience and exact verified task service-account email.
- `x-cloudtasks-taskname` is operational metadata, never authentication by itself.
- Missing configuration, token, audience mismatch, or identity mismatch MUST return 401 before body processing.

## Gate 2 — One honest product position

- DueBack is a consumer follow-through product backed by a reusable Proof-of-Done runtime.
- The submitted product proves one company-follow-up recipe deeply.
- It MUST NOT claim arbitrary-company connectivity or global production coverage.
- Primary contrast: company systems close tickets; DueBack keeps the consumer's promise open.

## Gate 3 — Gemini is necessary and measurable

- Gemini MUST remain responsible for typed multimodal extraction, exact provenance, uncertainty,
  contradiction handling, and bounded interpretation of inbound replies.
- Gemini MUST NOT authorize tools or declare lifecycle completion.
- Per-case technical evidence MUST expose model status, latency, token usage and estimated cost when observed.
- A separate opt-in live-model corpus MUST report model/version, date, denominator, per-case failures,
  latency and token usage. Deterministic evaluation MUST remain separately labeled.

## Gate 4 — Reproducible demo versus real pilot

- `Accelerated proof demo`: complete reproducible loop through a controlled counterparty; no company contacted.
- `Controlled email pilot`: real provider boundary, restricted to approved owned/allowlisted addresses.
- Channel selection MUST disclose the difference before approval.
- Neither path proves bank settlement. The sandbox MUST never be described as a real company.

## Acceptance

1. A spoofed Cloud Tasks header without valid OIDC is rejected.
2. A valid token for the wrong audience or service account is rejected.
3. Scheduler pins the same configured audience that workers validate.
4. Public copy states the consumer position and limited connectivity.
5. Technical trace shows measured Gemini telemetry when present and labels missing data.
6. `pnpm evaluate:live-model` writes a versioned, honest live report or exits non-zero.
7. Review names and explains both execution modes without technical channel jargon.
