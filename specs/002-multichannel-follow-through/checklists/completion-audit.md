# Completion audit — Multichannel Follow-Through

Audited: 2026-08-16. `PASS` requires direct current-state evidence. `PARTIAL` is not completion.
`EXTERNAL` requires evidence that cannot be manufactured from deterministic fixtures.

## Functional requirements

| ID | Status | Authoritative evidence / remaining gap |
|---|---|---|
| FR-001 | PASS | `plan-review.tsx` renders channel, identities, full message, shared data, timing, cadence, send cap, proof, expiry context and return email. |
| FR-002 | PASS | `/api/channels`, the keyboard-operable channel selector, `plan-controller.ts`, and denial tests prevent selection or activation when health is not `AVAILABLE`. |
| FR-003 | PASS | `PlanService.revise` creates a new hash/version and only permits `AWAITING_APPROVAL`; plan-service tests verify changed recipient/hash. |
| FR-004 | PASS | Syntax validation, explicit anti-abuse confirmation, plan binding, allowlist and deterministic policy are independently enforced. |
| FR-005 | PASS | Inbound/model candidates enter `InboundService` and deterministic evidence policy; neither can revise a plan or select a tool. |
| FR-006 | PASS | Approval checks the live capability registry server-side; UI also blocks an unavailable active channel. |
| FR-007 | PARTIAL | Plain-text, controlled-recipient and opaque reply-route adapter is tested; verified-domain external smoke is missing. |
| FR-008 | PASS | `ActionBroker` calls `authorizeAction` immediately before reservation/budget/provider execution. |
| FR-009 | PASS | Local stable action key and Firestore reservation are independent of provider idempotency. |
| FR-010 | PASS | Unknown acceptance remains reserved and is never blindly resent; its case, stable action key, channel, redacted recipient, correlation, time and reason are persisted for explicit reconciliation. |
| FR-011 | PASS | Every broker receipt is enriched before persistence with case, channel, correlation and stable action-idempotency identity alongside provider ID, recipient fingerprint and timestamps. |
| FR-012 | PASS | Transport projection is separate from evidence reconciliation; receipt/ACK tests cannot produce `DONE`. |
| FR-013 | PASS | Bounce/complaint/suppression halt nonterminal cases with `NEEDS_ATTENTION` and transactionally create one deduplicated intervention and user notification. |
| FR-014 | PASS | Cloud Tasks backoff and `CaseRunner` attempt cap transition exhausted work to one intervention. |
| FR-015 | PASS | Signed provider webhook reserves then schedules bounded Cloud Task processing; handler does not call Gemini inline. |
| FR-016 | PASS | Original-body signature, timestamp tolerance, stable ID and replay reservation have deterministic tests. |
| FR-017 | PASS | Opaque reply route and exact sender are enforced; when `In-Reply-To` is available it must independently resolve through the stored provider message ID to the same case. |
| FR-018 | PASS | Inbound Gemini flow is tool-less, typed and instructed to treat all text as data; addresses and content never grant authority. |
| FR-019 | PASS | Exact provider endpoint, ten-second abort, text/metadata limits and unsafe-ID rejection are tested. |
| FR-020 | PASS | Gemini emits only typed candidates; deterministic services own lifecycle transitions. |
| FR-021 | PASS | Evidence levels and deterministic verifier distinguish ACK, commitment, merchant confirmation and settlement. |
| FR-022 | PASS | ACK/auto-reply classifications remain insufficient; deployed sandbox visibly rejects `REQUEST_ACKNOWLEDGED`. |
| FR-023 | PASS | Proposal changes/uncertainty raise an intervention and never reach evidence reconciliation. |
| FR-024 | PASS | Signature, state, case, sender, freshness, completeness and exact-field checks fail closed. |
| FR-025 | PASS | Result UI says merchant-confirmed and explicitly says bank settlement is not verified. |
| FR-026 | PASS | The result maps every case state plus scheduled, sending, accepted, delivered, bounced, suppressed and failed transport outcomes to human-readable copy. |
| FR-027 | PASS | The result exposes the next check/action, current attempt allowance, active channel, masked recipient and return path. |
| FR-028 | PASS | Cloud Tasks/Firestore continuation survives tab reload and public deployed E2E proves it. |
| FR-029 | PASS | Notification record has stable dedupe identity and owned deep link; duplicate evidence tests create one record. |
| FR-030 | PASS | Action and notification transport events independently project accepted, delivered, bounced, complained, suppressed, failed and unavailable without changing evidence truth. |
| FR-031 | PASS | Control service and race tests prevent sends after stop/delete and terminal inbound is rejected before model execution. |
| FR-032 | PASS | The explicit “This isn't resolved” route reopens only `DONE` cases with a required reason, preserves prior evidence, and moves to `NEEDS_ATTENTION` before any resume decision. |
| FR-033 | PASS | Capability schema/endpoint report send, receive, threading, receipts, authenticated replies, OAuth and health. |
| FR-034 | PASS | Public labels and capability reason codes distinguish sandbox, managed email, Gmail and controlled partner fixture. |
| FR-035 | PASS | Sandbox and email implement `ClosedActionAdapter` and return the shared receipt shape. |
| FR-036 | PASS | The signed partner fixture passes common conformance plus broker authorization, retry, stable idempotency, enriched receipt and duplicate-suppression integration coverage. |
| FR-037 | PASS | Gmail gate is rejected/documented and capability remains `FUTURE` with no authority. |
| FR-038 | PASS | Research specifies a managed reply route if Gmail is later accepted; no broad inbox scope is requested now. |
| FR-039 | PASS | Email requires explicit controlled-domain allowlist; public UI requires legitimate-contact confirmation and sends max three times. |
| FR-040 | PASS | Transactional budgets exist per owner/recipient/domain/channel; case and notification caps are separately enforced. |
| FR-041 | PASS | Observability redaction tests exclude content, headers, credentials and addresses while allowing hashes/statuses. |
| FR-042 | PASS | Raw inbound subject/text is stored only in a server-owned envelope with a 24-hour TTL; provider/thread records also carry bounded deletion timestamps and client rules deny access. |
| FR-043 | PASS | Secret Manager/deploy configuration keeps secrets server-side; `.env.example` contains no values. |
| FR-044 | PASS | Review requires visible legitimate-relationship authorization before activation. |
| FR-045 | PASS | Closed action enum and adapters cannot browse, pay, threaten, post, bypass CAPTCHA or mutate remedies. |
| FR-046 | PASS | Deterministic suites cover authorization, mutation, uncertainty, retry, provider failure visibility, replay, false-DONE, cross-case isolation, explicit reopen and adapter lifecycle parity. |
| FR-047 | EXTERNAL | No controlled mailbox/domain/provider credentials exist, so no external email smoke result can be claimed. |
| FR-048 | PASS | Public Firebase-anonymous sandbox judge path needs no paid credential and remains deployed. |
| FR-049 | EXTERNAL | Script and shot list exist; the final public continuous video has not been recorded/published. |
| FR-050 | PARTIAL | Architecture, secrets, retention, abuse, reproduction, limitations and rollback are documented; provider-console webhook/domain steps need final screenshots/values once provisioned. |

## Success criteria

| ID | Status | Authoritative evidence / remaining gap |
|---|---|---|
| SC-001 | EXTERNAL | Requires consented first-time human participants; synthetic agents are explicitly excluded. |
| SC-002 | PASS | Revision/hash/stale-approval tests cover current authorizing fields and server blocks editing an active plan. |
| SC-003 | EXTERNAL | Deterministic authorization passes, but the required controlled external-email corpus does not exist. |
| SC-004 | PASS | Duplicate delivery and uncertain-acceptance tests execute one logical provider call; deployed sandbox ledger also shows one receipt. |
| SC-005 | PASS | Accepted events are reserved before enqueue and transition to `ENQUEUED`, `PROCESSED`, or visible `FAILED` with reason codes; enqueue-failure and replay tests prevent silent loss. |
| SC-006 | PASS | Invalid signature, replay, stale, cross-case, unknown/ambiguous route, terminal case and unexpected sender are tested; the published 28-case report includes four email outcomes. |
| SC-007 | PASS | Deterministic and deployed paths observe zero completion from delivery/ACK alone. |
| SC-008 | PARTIAL | Deployed sandbox continues after tab closure; managed-email bidirectional external case is missing. |
| SC-009 | PASS | Notification dedupe key and repeated-event tests yield one logical notification. |
| SC-010 | PARTIAL | Fresh deployed runs complete in 21.9–31.6 seconds, but the final continuous under-four-minute video is missing. |
| SC-011 | EXTERNAL | Sandbox IDs/timing are documented; managed-email smoke evidence is missing. |
| SC-012 | PASS | Capability and server denial tests pass; public browser tests verify both an available approved channel and blocked activation when the active channel is unavailable. |

## Non-code completion gates

- External email: verified sender, inbound domain, controlled mailbox, API key and webhook secret.
- Human study: consented adults following the published no-coaching protocol.
- Participant attestation: sanctions/conflict-of-interest confirmation by the entrant.
- Submission: public repository access, continuous public video, Devpost fields and final submission.

No fixture, synthetic persona or local mock may be substituted for these gates.
