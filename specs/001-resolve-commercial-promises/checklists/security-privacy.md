# Security & Privacy Requirements Checklist: Resolve Commercial Promises

**Purpose**: Review whether security, authority, privacy, and hostile-input requirements are complete and unambiguous before implementation
**Created**: 2026-08-15
**Feature**: [spec.md](../spec.md)

**Review Ownership**: This is a reviewer-owned requirements-quality artifact. `[x]` means the written requirement was reviewed and found sufficient; it does not mean implementation is complete.

## Authority Boundaries

- [x] CHK001 Are all authority-bearing fields that invalidate approval explicitly enumerated? [Completeness, Spec §FR-005–FR-008]
- [x] CHK002 Is the meaning of “explicitly bounded by the person” defined without permitting ambiguous critical fields to authorize execution? [Ambiguity, Spec §FR-004]
- [x] CHK003 Are actions requiring renewed approval distinguished from actions permitted by the existing plan? [Clarity, Spec §FR-005–FR-011]
- [x] CHK004 Are stop, revoke, expiry, deletion, and reopen semantics specified for every relevant lifecycle state? [Coverage, Spec §FR-006]
- [x] CHK005 Is recipient identity derived from approved data rather than untrusted content, and is that requirement explicit? [Completeness, Spec §FR-009]

## Hostile and Untrusted Inputs

- [x] CHK006 Are trust boundaries documented for uploads, model output, callbacks, controlled services, and future channel adapters? [Coverage, Spec §FR-009, §FR-023]
- [x] CHK007 Are requirements defined for prompt injection embedded in visible text, metadata, QR content, PDFs, and tool output? [Gap, Edge Cases]
- [x] CHK008 Are file type, size, page/count, URL, decompression, and processing-budget limits specified? [Gap, Assumption]
- [x] CHK009 Are invalid, unsigned, replayed, late, out-of-order, and cross-case callback requirements complete and mutually consistent? [Coverage, Edge Cases]
- [x] CHK010 Is UNKNOWN/ambiguous evidence explicitly prevented from becoming authorization or completion? [Clarity, Spec §FR-004, §FR-016–FR-017]

## Identity, Isolation, and Data Protection

- [x] CHK011 Are authentication and ownership requirements specified for intake, plan approval, case inspection, callbacks, and deletion? [Gap]
- [x] CHK012 Are cross-user and cross-case data isolation requirements explicitly defined? [Gap]
- [x] CHK013 Are the exact personal fields disclosed before approval and the fields permitted in each external action specified? [Clarity, Spec §FR-005, §FR-025]
- [x] CHK014 Are artifact retention periods, deletion timing, backup behavior, and permissible audit tombstones defined? [Gap, Spec §FR-025–FR-026]
- [x] CHK015 Are log, trace, error, and evaluation-output redaction requirements complete for raw artifacts and personal fields? [Completeness, Spec §FR-026, §FR-029]
- [x] CHK016 Are access requirements for private artifacts and expiring links documented, including expired/reused link behavior? [Gap, Edge Cases]

## Integrity and Abuse Resistance

- [x] CHK017 Are stable deduplication identities and collision behavior specified for intake, actions, callbacks, notifications, and transitions? [Clarity, Spec §FR-012]
- [x] CHK018 Are concurrency and crash-boundary requirements defined for “external effect occurred but response was not recorded”? [Coverage, Edge Cases]
- [x] CHK019 Are retry ceilings, rate limits, per-case budgets, and denial-of-wallet behavior expressed as measurable requirements? [Gap]
- [x] CHK020 Are audit requirements sufficient to attribute every authorization, denial, model proposal, action attempt, verification, and override? [Completeness, Spec §FR-013]
- [x] CHK021 Are callback authenticity, freshness, nonce/signature, and secret-rotation expectations specified independently from model interpretation? [Gap]

## Security Acceptance Quality

- [x] CHK022 Can unauthorized-action blocking be objectively measured without relying on absence of UI output? [Measurability, Spec §SC-006]
- [x] CHK023 Does the evaluation corpus require at least one attack for each documented trust boundary and an expected deterministic outcome? [Coverage, Spec §FR-028–FR-029]
- [x] CHK024 Are security failures required to become visible intervention states without leaking sensitive input? [Coverage, Spec §SC-005]
- [x] CHK025 Are security claims bounded so the project does not imply forensic authenticity, guaranteed prompt-injection prevention, or financial settlement? [Consistency, Spec §FR-023–FR-024]

## Notes

- Mark items only after reviewing the written requirements.
- Unchecked gaps must be resolved or explicitly accepted before `/speckit.implement`.
- `/speckit.implement` reads this checklist but does not change its markers.
