# Research: Winning Product Loop

## R1 — Explicit-only inbound evidence

**Decision**: Build evidence candidates exclusively from facts explicitly extracted from normalized
inbound content. Preserve missing fields. Store provider webhook validity, expected sender match,
thread correlation and content evidence as separate assessments.

**Rationale**: Current `InboundService` substitutes `requirement.amountMinor`, currency and reference
when the interpretation omits them, then marks signature valid and issuer trusted. That can transform
an incomplete reply into matching evidence and violates the constitution's verified-outcome rule.

**Alternatives considered**:

- Keep fallback for convenience: rejected because it manufactures evidence.
- Let Gemini decide whether omission is harmless: rejected because the model cannot own completion.
- Require every email to repeat every fact: accepted for the controlled pilot; later provider-specific
  authenticated structured evidence can relax this only through a new explicit contract.

## R2 — Durable analysis with Cloud Tasks

**Decision**: Split intake acceptance from extraction. Persist `DraftCase + AnalysisJob` before
enqueue, return 202, then analyze through an OIDC Cloud Task with versioned lease and bounded retry.

**Rationale**: The current POST holds open for Gemini and retries inline, producing 15–25 second
perceived waits and no resumable state. The split uses already-essential infrastructure and makes
Taskmaster behavior visible.

**Alternatives considered**:

- Client timeout around the existing POST: improves failure copy but remains non-durable.
- SSE while keeping inline model work: improves perception but not restart safety.
- Pub/Sub: unnecessary additional infrastructure for a bounded job already suited to Cloud Tasks.

## R3 — Polling before SSE

**Decision**: Use bounded polling of a small owner-checked status endpoint for P0. Persist stages and
make the API cache-safe. Add SSE only if measured polling degrades the demo.

**Rationale**: Polling reuses the deployed stateless web service, survives reconnects naturally and
minimizes solo-founder surface area. The value comes from real persisted stages, not transport style.

**Alternatives considered**:

- SSE: useful but adds reconnect/proxy complexity without a demonstrated need.
- Firestore direct browser listeners: rejected because it expands public rules and couples UI to storage.

## R4 — Accelerated time as approved policy

**Decision**: Add `executionMode` and `timingPolicyVersion` to the plan. In demo mode, derive relative
wake times server-side after approval and label them. Do not change evidence or policy semantics.

**Rationale**: Fixed future examples strand judges in `SCHEDULED`; direct “complete now” buttons would
fake autonomy. A canonical timing policy produces fast but authentic Cloud Task and callback events.

**Alternatives considered**:

- Make example dates permanently overdue: brittle and eventually misleading.
- Client-side clock manipulation: rejected because server state remains inconsistent.
- Hard-code final UI: prohibited by honest evidence requirements.

## R5 — Extend current plan revision model

**Decision**: Expand existing revision commands to all displayed facts, contact target, evidence and
mode. Keep one canonical plan hash and approval model.

**Rationale**: Backend versioning already exists. A new workflow/form engine would duplicate security
logic and threaten the deadline.

**Alternatives considered**:

- Re-run Gemini after every correction: costly and makes user authority ambiguous.
- Delete/restart: unacceptable UX and loses audit history.

## R6 — Append-only case events as shared read source

**Decision**: Emit redacted typed `CaseEvent` records alongside successful state transitions. Build
consumer timeline and judge console projections from events plus allowlisted ledger metadata.

**Rationale**: Current domain events and channel events are fragmented. One ordered read source makes
autonomy visible while leaving authoritative state in existing drafts/runs and ledgers.

**Alternatives considered**:

- Parse Cloud Logging at runtime: slow, privileged and unsuitable for consumer UI.
- Reconstruct everything ad hoc from collections: inconsistent ordering and repeated joins.
- Event-source the whole product: excessive rewrite; events remain audit/read projection only.

## R7 — Firebase anonymous-to-Google linking

**Decision**: Allow anonymous intake, require Google-backed recoverable identity before activation,
and atomically claim/link the draft. Keep one stable internal owner identity mapping independent of
provider UID changes during account linking.

**Rationale**: Existing anonymous auth prevents unauthenticated data exposure but cannot recover a
case on another device. Firebase is already deployed and meets the minimal account need.

**Alternatives considered**:

- Custom magic links: adds email deliverability and token lifecycle before the email gate.
- Anonymous deep-link bearer token: unsafe as sole ownership and easy to forward.
- Full account/dashboard system: unnecessary; only compact history is required.

## R8 — Persisted email readiness, not environment inference

**Decision**: Managed Email capability requires static configuration and a fresh persisted smoke
record covering outbound, inbound, correlation and controlled sender/recipient. Any missing/expired
gate reports unavailable.

**Rationale**: Environment variables prove configuration presence, not MX/webhook/provider health.
Fail-closed readiness prevents a broken channel from becoming approvable.

**Alternatives considered**:

- Healthcheck on every review request: introduces provider dependency and latency.
- Environment-only readiness: current approach; insufficient evidence.
- Enable arbitrary recipient after one smoke: rejected for abuse/deliverability risk.

## R9 — Read-only redacted Evidence Console

**Decision**: Serve a typed projection only for owned synthetic demo cases when judge mode is enabled.
Expose correlation IDs, safe timestamps, model metadata, reason codes, hashes/short IDs and provider
states; exclude raw inputs, prompts, addresses, signatures and secrets.

**Rationale**: Judges need architecture evidence during the demo, but direct Cloud console access and
raw internal documents create security, privacy and reliability problems.

**Alternatives considered**:

- Embed Cloud Console: requires privileged login and disrupts video.
- Client-side fake overlay: violates reproducibility.
- Public unrestricted observability endpoint: unacceptable cross-tenant disclosure.

## R10 — Live model evaluation separated from CI corpus

**Decision**: Create an opt-in live runner using versioned synthetic fixtures and publish immutable
JSON plus an interpretation document. Use zero retries for measured outcomes and report provider
failures separately.

**Rationale**: The current 28-case deterministic evaluation demonstrates policy but makes zero model
calls. A separate report proves Gemini value without making routine CI flaky or expensive.

**Alternatives considered**:

- Replace deterministic corpus with live calls: rejected because it reduces reproducibility.
- Report hand-selected screenshots: insufficient denominator and failure evidence.

## R11 — Submission release manifest

**Decision**: Add a versioned manifest and validation command for eligibility acknowledgment,
repository access, video URL/duration/language, deployed revision, architecture and claim evidence.

**Rationale**: These external gates are eliminatory and currently remain unchecked prose. A failing
validator keeps placeholders and unsupported claims visible before submission.

**Alternatives considered**:

- Manual checklist only: already exists but easy to overlook.
- Automate Devpost submission: unnecessary external mutation and account risk.

## Resolved Clarifications

- P0 identity provider: Firebase Google sign-in/account linking, not custom magic link.
- P0 progress transport: polling, not SSE.
- P0 demo timing: server-derived relative policy, not fixed dates.
- P0 event strategy: audit/read projection, not full event sourcing.
- Email public status: unavailable until fresh persisted smoke health exists.
- Controlled email scope: two owned/authorized mailboxes only.
- No unresolved `NEEDS CLARIFICATION` remains for planning.
