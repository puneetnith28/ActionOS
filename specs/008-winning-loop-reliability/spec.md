# Feature 008 — Winning-loop reliability

## Objective

Make the controlled public story reliable under duplicate task delivery, callback races and Cloud
Run instance turnover before any visual release work resumes.

## Requirements

- A worker observing an in-flight duplicate MUST NOT mutate case state or schedule another wake.
- Only the worker owning the action reservation may publish its receipt-backed transition.
- Callback state races MUST return a retryable status distinct from permanently invalid evidence.
- The controlled counterparty MUST retry only transient callback failures with bounded backoff.
- A retried callback MUST preserve its evidence identity and body while refreshing authentication
  freshness.
- Exhausted callback delivery MUST emit a redacted reason and MUST NOT leak callback content.
- The public release scenario MUST not depend on process-local state for terminal completion.

## Kill gate

Run the deployed winning path ten times sequentially with one worker and Playwright retries disabled.
All ten cases must reach the limited `Company confirmed` terminal state within 90 seconds. During the
gate window there must be zero callback `422` responses and zero unexpected run-case `500` responses.
