# Completion Audit: Consumer Case Inbox

**Audited**: 2026-08-17  
**Rule**: `PASS` requires executable or deployed evidence. `PARTIAL` and `TARGET` are not completion.

## Kill gates

| Gate | Status | Current evidence | Missing evidence |
|---|---|---|---|
| A — Product truth | PASS | Server-side channel fixtures plus revision `dueback-web-00049-4jd`; anonymous intake remains sandbox even when email is configured | None |
| B — Personal inbox | PARTIAL | Owner-scoped paginated `/api/cases`, Google sign-in, Firebase Hosting OAuth boundary, authenticated empty state | Same real case recovered in a clean browser; non-owner denial recorded |
| C — Understandable case | PASS | Owner-checked safe detail DTO, bounded conversation, Promised-vs-Observed, ACK rejection, responsive header and deployed result paths | Continuous managed-email sufficient completion remains optional; weak ACK evidence already exists |
| D — Durable return | PASS | Attention/completion/failure tests, concurrent replay dedupe, lifecycle truth, bounded retry and deployed closed-tab browser fixture | None for sandbox path |
| E — Control/evidence/release | PARTIAL | Idempotent narrow controls, stale/late-event adversarial tests, gated judge trace, safe export and accessibility browser fixture implemented | Run accessibility fixture and record the final demo |

## Requirement traceability

| Requirement | Status | Evidence / next test |
|---|---|---|
| FR-001 | PASS | Anonymous intake and sandbox flow in deployed example matrix |
| FR-002 | PASS | Managed-email activation rejects anonymous identity in `plan-controller.test.ts` |
| FR-003 | PASS | Fresh anonymous→Google linking preserves Firebase UID; existing-account collision intentionally fails closed under D-023 |
| FR-004 | PARTIAL | Sign-in and owner-scoped inbox deployed; Gate B two-browser case recovery pending |
| FR-005 | PASS | List/detail/export/technical routes are owner-scoped and mismatch is indistinguishable 404 |
| FR-006 | PASS | D-023 records fail-closed collision; activation is blocked without unsafe merge or ownership transfer |
| FR-007 | PASS | Global `My follow-ups`, Google sign-in and authenticated state deployed |
| FR-008 | PASS | Human buckets, status, attention badge and bounded status filter are implemented |
| FR-009 | PASS | Case summary/card projection and controller tests |
| FR-010 | PASS | Stable owner-scoped cursor, bounded pages, malformed/cross-filter rejection and retained-list “Load more” UI |
| FR-011 | PASS | Loading/empty/retry, retained list on pagination failure and last-known detail on refresh failure are covered |
| FR-012 | PASS | Consumer DTO and first-viewport `CaseStatus` show outcome, human status and next action |
| FR-013 | PASS | `channel-copy.test.ts` plus deployed channel-aware result/timeline |
| FR-014 | PASS | `case-conversation.test.ts` and bounded conversation component |
| FR-015 | PASS | Real weak ACK remained open with explicit missing/mismatched facts |
| FR-016 | PASS | Outcome comparison tests and completed result UI |
| FR-017 | PASS | Transport status and deterministic evidence status remain separate |
| FR-018 | PASS | Internal objects are projected server-side; technical events are reduced and collapsed by default |
| FR-019 | PASS | Last refresh, retained payload and retry behavior in case result |
| FR-020 | PASS | Attention, completion and deterministic terminal failure each create deduplicated records |
| FR-021 | PASS | Recorded/accepted/delivered/bounced/suppressed/failed lifecycle is persisted and projected separately |
| FR-022 | PASS | Minimal deep links and destination redaction are covered; no bearer authority is embedded |
| FR-023 | PASS | Retry is owner-scoped, idempotent, limited to three attempts and blocked after bounce/suppression |
| FR-024 | PASS | Owner sees lifecycle, redacted destination, attempts and eligible retry action |
| FR-025 | PASS | Exception screen renders one persisted bounded decision with explicit consequences |
| FR-026 | PASS | Control commands require version and idempotency key; concurrent command tests pass |
| FR-027 | PASS | Authority-changing correction cancels the active run, revokes approval and requires a new versioned approval |
| FR-028 | PASS | Stop/delete plus stale-approval and late-evidence adversarial tests fail closed |
| FR-029 | PASS | Owner- and demo-gated judge trace is persisted and redacted |
| FR-030 | PASS | Judge trace exposes allowlisted stages only; access/redaction tests pass |
| FR-031 | PASS | Static owner-checked export excludes identifiers, addresses, hashes and control authority |
| FR-032 | PARTIAL | Core product/README/architecture aligned; demo-script audit pending |
| FR-033 | PASS | Controlled-pilot and settlement limitations visible and documented |
| FR-034 | PASS | Unsupported channels remain unavailable/out of scope |
| FR-035 | PASS (current screens) | Keyboard/live status/reduced-motion/200%-reflow browser fixture passed against revision 00049 |

## Success criteria

| Criterion | Status | Evidence / gate |
|---|---|---|
| SC-001 | TARGET | Run Gate B with a real case and record elapsed time |
| SC-002 | PASS (deterministic) | List/detail/export/technical owner isolation and indistinguishable-denial tests pass |
| SC-003 | UNVERIFIED HUMAN TARGET | Synthetic feedback cannot satisfy it |
| SC-004 | PASS | Attention/completion/terminal failure transitions and concurrent attention replay are covered |
| SC-005 | PASS | Published weak-ACK deployed evidence plus adversarial tests |
| SC-006 | PASS | Consumer DTO fixtures and deployed default-channel matrix assert email/sandbox separation |
| SC-007 | PASS | Outcome comparison and explicit evidence projection |
| SC-008 | TARGET | Continuous controlled-email return demo pending |
| SC-009 | PASS (deterministic) | Judge trace redaction/eligibility contract and adversarial access tests pass |
| SC-010 | PASS (automated scope) | Keyboard/live status/reduced-motion/200%-reflow fixture passed on revision 00049; human assistive-tech study remains separate |
| SC-011 | PASS (deterministic) | External action, attention notification and control-command concurrency matrices pass |
| SC-012 | PARTIAL | Current docs mostly aligned; demo script and final submission audit pending |

## Next execution order

1. Deploy the safe consumer-detail revision and run the deterministic browser/accessibility fixtures.
2. Close Gate B with one Google-owned case and a clean-browser recovery/denial test.
3. Run the controlled managed-email smoke with one worker and zero retries.
4. Record one continuous four-minute demo and finish Devpost compliance.
