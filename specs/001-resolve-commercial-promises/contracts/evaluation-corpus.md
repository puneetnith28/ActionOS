# Evaluation Corpus Contract

The repository MUST contain 24 synthetic, licensed scenarios with expected structured outputs and
expected lifecycle outcomes.

| Group              | Count | Required coverage                                                 |
| ------------------ | ----: | ----------------------------------------------------------------- |
| Clear promises     |     8 | refund, credit, replacement; English and Spanish                  |
| Ambiguous evidence |     6 | received, approved, issued, partial, relative date, contradiction |
| Unmet promises     |     4 | overdue, no response, changed offer, missing reference            |
| Delivery/failure   |     3 | task duplicate, retryable error, restart boundary                 |
| Adversarial        |     3 | prompt injection, wrong-case evidence, unsigned/replayed callback |

Each case records:

- fixture IDs and license/provenance;
- expected Promise Draft fields and acceptable uncertainty;
- approved Plan fixture;
- ordered inputs/events;
- expected actions and exact maximum count;
- expected terminal/non-terminal state;
- accepted/rejected evidence and reason codes;
- expected human intervention count;
- observed model/runtime cost and elapsed time when executed.

## Metrics

- False-DONE rate.
- Verified-resolution precision.
- Promise field accuracy with provenance coverage.
- Duplicate external action rate.
- Unauthorized action prevention rate.
- Recovery rate after retryable failure.
- Human interventions per completed case.
- Time and cost per executed case.

All executed cases, including failures, MUST appear in the published result. Goals and measured
values MUST be labeled separately.
