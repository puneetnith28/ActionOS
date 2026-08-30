# Hackathon Readiness Requirements Checklist: Resolve Commercial Promises

**Purpose**: Review whether judging, reproducibility, demo, and eligibility requirements are sufficiently specified before implementation
**Created**: 2026-08-15
**Feature**: [spec.md](../spec.md)

**Review Ownership**: This is a reviewer-owned requirements-quality artifact. `[x]` means the written requirement was reviewed and found sufficient; it does not mean implementation is complete.

## Submission and Category Fit

- [x] CHK001 Is exactly one official category named consistently across the specification, plan, README, and eventual submission? [Gap]
- [x] CHK002 Is the autonomous multi-step behavior that makes ActionOS more than chat explicitly observable in the acceptance path? [Completeness, Spec §US2]
- [x] CHK003 Are the essential, non-decorative roles of Gemini 3.5+, Genkit, and each selected Google Cloud service specified? [Clarity, Plan §Technical Context]
- [x] CHK004 Is the Individual/Hobbyist positioning supported without implying an incorporated organization? [Consistency, Assumption]
- [x] CHK005 Are pre-existing templates, libraries, fixtures, and assets required to have provenance and compatible licenses? [Gap]

## Four-Minute Demo

- [x] CHK006 Does the demo requirement allocate observable time to problem, approval, external action, failure/retry, evidence rejection, completion, and Cloud proof? [Completeness, Spec §SC-008]
- [x] CHK007 Is accelerated time required to be visibly labeled at every judge-facing surface where confusion is possible? [Clarity, Assumptions]
- [x] CHK008 Are controlled merchant, synthetic data, fixtures, and replay labels specified consistently for UI, video, README, and evaluation output? [Consistency, Spec §FR-023, §SC-010]
- [x] CHK009 Is the exact claim shown at completion constrained to `MERCHANT_CONFIRMED`, with `FUNDS_SETTLED` visibly excluded? [Clarity, Spec §FR-014, §FR-019, §FR-024]
- [x] CHK010 Are fallback requirements documented for model latency, email unavailability, demo reset, and cloud-task delay? [Gap]
- [x] CHK011 Is a clean, deterministic demo reset/seed requirement defined without hiding failures or fabricating production state? [Gap]

## Reproducibility and Evidence

- [x] CHK012 Are all credentials, services, regions, quotas, fixtures, seed steps, and expected outputs needed by another evaluator documented as requirements? [Completeness, Spec §FR-030]
- [x] CHK013 Are measured results required to identify corpus version, model/version, configuration, timestamp, denominator, failures, and cost method? [Gap, Spec §FR-029, §SC-012]
- [x] CHK014 Are public-repository/access requirements and judge-safe deployment availability specified through the full evaluation period? [Gap]
- [x] CHK015 Are architecture evidence requirements precise enough to demonstrate durable state, retry, tool isolation, and a real cross-service boundary? [Clarity, Spec §SC-007–SC-008]
- [x] CHK016 Are the conditions for claiming “one external action” and “one completion transition” measurable across product, merchant, and logs? [Measurability, Spec §SC-004]

## User Value and Portability

- [x] CHK017 Is the target user's pain expressed as an outcome lost through follow-up failure rather than as a generic automation need? [Clarity, Spec §US2]
- [x] CHK018 Are the first user, first promise type, and exclusions explicit enough to prevent the universal-platform vision from expanding the MVP? [Consistency, Spec §FR-021–FR-022, Assumptions]
- [x] CHK019 Are bill-credit and replacement examples defined as portability proofs rather than three promised production integrations? [Clarity, Spec §US4]
- [x] CHK020 Are Spanish-input and English-judging requirements measurable without claiming broad multilingual support? [Clarity, Spec §FR-027, §SC-011]
- [x] CHK021 Are the non-technical usability study protocol and success interpretation sufficiently defined for SC-001 and SC-002? [Gap, Spec §SC-001–SC-002]

## Schedule and Kill Test

- [x] CHK022 Is the 48-hour walking-skeleton pass/fail condition specified as one deployed intake-to-proof route? [Clarity, Plan §Summary]
- [x] CHK023 Are features prohibited before the kill test explicitly listed and consistent with the constitution? [Consistency, Constitution §V]
- [x] CHK024 Are pivot triggers defined for failure of external action, durable resumption, deterministic verification, or deployability? [Gap]
- [x] CHK025 Are final delivery requirements complete for README, architecture diagram, repository access, hosted URL, video, English/subtitles, and free judge access? [Gap]

## Notes

- Mark items only after reviewing the written requirements.
- Unchecked gaps must be resolved or explicitly accepted before `/speckit.implement`.
- `/speckit.implement` reads this checklist but does not change its markers.
