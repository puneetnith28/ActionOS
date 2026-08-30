# Security and Privacy Checklist: Winning Product Loop

**Feature**: [spec.md](../spec.md)

## False Completion

- [ ] Required evidence fields absent from inbound content remain absent in the candidate.
- [ ] Expected plan values are never copied into received evidence.
- [ ] Provider authentication, counterparty identity and evidence sufficiency are separate decisions.
- [ ] Refund, replacement, document and general outcomes each fail closed on missing proof.
- [ ] Model output cannot authorize, authenticate, transition or complete a case.

## Authority and Identity

- [ ] Every external action is bound to owner, plan version, hash, recipient, channel and expiry.
- [ ] Corrections invalidate prior approval and stale tasks fail closed.
- [ ] Anonymous-to-recoverable ownership linking is atomic and tested for races.
- [ ] Cross-owner case, history, notification and console access is denied.
- [ ] Stop, revoke, delete, dispute and cancellation win against late work.

## Email Pilot

- [ ] Verified sender, reply domain, signed inbound webhook and exact allowlist are healthy.
- [ ] Empty or failed readiness denies Managed Email.
- [ ] Arbitrary recipients, bulk outreach and user-controlled From addresses are impossible.
- [ ] Sender/thread authenticity is evaluated beyond a provider webhook signature.
- [ ] Bounce, complaint and suppression stop future sends.
- [ ] Raw bodies, addresses, headers, tokens and signatures are excluded from public logs/console.

## Durable Processing

- [ ] Case creation, artifact reservation and task enqueue partial failures are recoverable.
- [ ] Duplicate intake, task, action, callback and notification deliveries deduplicate durably.
- [ ] Model calls have deadlines, bounded retries and pre-reserved budgets.
- [ ] Cancelled/deleted/superseded analysis cannot publish a late result.
- [ ] Accelerated demo changes time only and does not bypass security boundaries.

## Data Minimization

- [ ] Raw artifacts and inbound content follow documented bounded retention.
- [ ] Evidence Console is restricted to owned synthetic cases and is read-only/redacted.
- [ ] Deep links reveal no authority without recoverable owner authentication.
- [ ] Deletion language distinguishes requested deletion, TTL and forensic erasure.
- [ ] Evaluation fixtures contain synthetic data and license-compatible assets only.

## Gate

No Managed Email deployment or public claim may proceed while any applicable checkbox is open.
