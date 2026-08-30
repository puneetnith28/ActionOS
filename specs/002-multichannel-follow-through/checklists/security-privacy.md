# Security and Privacy Checklist: Multichannel Follow-Through

- [x] Approval binds channel, recipient, exact message scope, cadence, limits, proof and expiry
- [x] Pilot recipient allowlist blocks arbitrary public email
- [x] Durable local idempotency survives provider-window expiry
- [x] Uncertain timeout preserves reconciliation state rather than blindly resending
- [x] Webhook verifies original bytes, signature, timestamp and replay identity
- [x] Inbound retrieval uses exact provider endpoints and bounded timeouts
- [x] Bodies, headers, signatures, quoted text and attachments remain hostile data
- [x] Model flows have no credentials, actions or lifecycle authority
- [x] Cross-case, cross-owner and ambiguous routing cannot alter state
- [x] Bounce, complaint and suppression stop future sends
- [x] Logs redact address, body, attachment, token and secret data
- [x] Retention and requested deletion cover inbound content and provider events
- [x] Stop, revoke, expiry and deletion dominate scheduled work
- [x] Abuse disclosure and legitimate-relationship confirmation are visible
- [ ] External smoke uses only controlled authorized mailboxes
