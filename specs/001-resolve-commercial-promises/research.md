# Technical Research: Resolve Commercial Promises

## Decision 1 — Google agent framework

**Decision**: Use Genkit with TypeScript and `@genkit-ai/google-genai` configured through its
`vertexAI()` initializer. The older main `@genkit-ai/vertexai` Gemini export is deprecated and will
not be used.

**Rationale**: DueBack needs typed multimodal extraction, tools, prompt/evaluation versioning, and
tracing inside a web product. Genkit supplies these capabilities without adding a second language.
Durability and authorization remain explicit application responsibilities, which makes the judging
evidence stronger than implying the framework guarantees them.

**Alternatives considered**:

- **ADK/Python**: stronger agent branding and trajectory evaluation, but adds a Python service and
  does not remove the need for the deterministic runtime. Rejected for the 48-hour slice.
- **Both ADK and Genkit**: rejected as architectural decoration and duplicated complexity.
- **Direct Gemini SDK**: rejected because it weakens compliance and loses Genkit's typed flows,
  tools, local inspection, traces, and evaluation surface.

## Decision 2 — Durable execution

**Decision**: Use Firestore as the source of truth and Cloud Tasks for delayed/retried work.

**Rationale**: Cloud Tasks is at-least-once. DueBack explicitly demonstrates safe redelivery through
stable action keys, task/event dedupe keys, optimistic case versions, and transactions. Scheduled
tasks can wake a case after its promise deadline without keeping a process alive.

**Alternatives considered**:

- **Pub/Sub plus Cloud Tasks**: rejected because one queue abstraction is sufficient for P0.
- **In-memory or framework session state**: rejected because it cannot survive scale-to-zero or
  redeploys and would fail the central demo.
- **Custom polling loop**: rejected because it obscures retry policy and wastes runtime.

## Decision 3 — State authority

**Decision**: A pure domain reducer is the only component allowed to apply case transitions.

**Rationale**: Gemini proposes interpretations; adapters return data; neither may decide lifecycle.
Every command supplies the expected case version and produces one or more immutable domain events.
This makes illegal transitions, concurrency, replay, and false completion unit-testable.

**Alternatives considered**:

- **Agent-controlled state**: rejected because untrusted content or hallucination could close or
  authorize a case.
- **Connector-controlled state**: rejected because it couples provider semantics to core policy.

## Decision 4 — Evidence model

**Decision**: Use explicit evidence levels and deterministic requirement predicates.

```text
PROMISE_RECORDED < REQUEST_ACKNOWLEDGED < MERCHANT_COMMITTED
                 < MERCHANT_CONFIRMED < FUNDS_SETTLED
```

**Rationale**: The demo contract requires `MERCHANT_CONFIRMED`. Gemini may extract candidate claims
and provenance, but the verifier checks schema, signature, case, amount, currency, reference,
freshness, and required level. The product never claims `FUNDS_SETTLED` from merchant confirmation.

**Alternatives considered**:

- **LLM judge for completion**: rejected as circular and unsafe.
- **Any confirmation email means done**: rejected because it reproduces false-DONE behavior.

## Decision 5 — Controlled counterparty

**Decision**: Deploy a separate Merchant Sandbox service with deterministic scenarios, independent
state, signed callbacks, its own request log, and explicit UI/README labels.

**Rationale**: There is no authorized universal merchant-refund API. A real HTTP boundary can prove
tool execution, pending states, retries, callbacks, signatures, idempotency, and evidence policy
without pretending to issue real money.

**Alternatives considered**:

- **In-process mock**: rejected because it makes the demo circular and visually unconvincing.
- **Automating a real retailer website**: rejected because of credentials, CAPTCHA, terms, and
  irreproducibility.
- **Bank connection**: rejected due to privacy, approval, and settlement-verification risk.

## Decision 6 — Intake and identity

**Decision**: Complete web/mobile upload first. Add forwarded email only after the end-to-end path is
stable. Inbound content may create a draft but never authorize execution.

**Rationale**: Upload is deterministic and makes the demo independent of mail latency. Forwarding is
the best real distribution adapter but provider/DNS setup is a schedule risk. Broad Gmail access is
unnecessary and may involve restricted scopes and trust friction.

**Alternatives considered**:

- **Full Gmail watch/read access**: rejected for P0 because the user can share only the relevant
  artifact and avoid broad inbox permissions.
- **WhatsApp P0**: rejected because business onboarding, template rules, and approval dependency can
  block a solo submission.
- **PWA share target as the only input**: rejected because browser support is uneven.

## Decision 7 — Artifact handling and privacy

**Decision**: Accept only PDF, JPEG, PNG, and bounded text. Store artifacts privately only when
needed, issue short-lived access, remove metadata where practicable, log hashes/IDs rather than
content, and provide case deletion.

**Rationale**: Receipts and emails contain PII. Passive allowlisted formats and synthetic demo data
reduce attack and compliance surface without claiming a full malware-scanning system.

**Alternatives considered**:

- **Arbitrary files, URLs, or HTML**: rejected due to SSRF, scripts, macros, file bombs, and prompt
  injection surface.
- **Permanent raw-artifact retention**: rejected as unnecessary for the demo and user value.

## Decision 8 — Model boundary

**Decision**: Gemini 3.5+ produces schema-validated `PromiseDraft` and `EvidenceCandidate` objects,
each critical field carrying a source citation and confidence. Invalid output or missing critical
fields leads to correction or `NEEDS_ATTENTION`, never guessed execution.

**Rationale**: Multilingual, multimodal, contradictory commercial language is the irreducibly
probabilistic work. Permission, idempotency, transitions, and evidence acceptance stay deterministic.

**Alternatives considered**:

- **OCR plus regular expressions only**: retained as deterministic preprocessing where helpful but
  insufficient for relative deadlines, cross-message reconciliation, and semantic evidence levels.
- **Free-form model output**: rejected because it cannot be safely evaluated or persisted.

## Decision 9 — Observability and evaluation

**Decision**: Correlate product events, task deliveries, tool calls, model traces, and counterparty
receipts with `run_id`/`case_id`. Publish a versioned 24-case corpus and measured outputs.

**Rationale**: Judges must see that the architecture exists, and false-DONE claims need a
reproducible denominator. Logs exclude raw artifacts and full prompts.

**Alternatives considered**:

- **Screenshots of successful cases**: rejected as non-reproducible and selective.
- **LLM-only quality score**: rejected; deterministic expectations are primary.

## Decision 10 — Deployment and cost controls

**Decision**: Two scale-to-zero Cloud Run services, bounded task retries, upload limits, per-case
budgets, maximum instances, budget alerts, and synthetic seeded demos.

**Rationale**: This is sufficient to prove a real cloud boundary while minimizing cost and denial of
wallet risk. No additional managed service enters without an acceptance requirement.

**Alternatives considered**:

- **GKE or always-on workers**: rejected as unnecessary.
- **Multiple agent services**: rejected because there is no independent responsibility requiring
  separate agents.

## Primary references

- Spec Kit: https://github.com/github/spec-kit
- Genkit: https://firebase.google.com/products/genkit
- Gmail scopes/policies: https://developers.google.com/workspace/gmail/api/auth/scopes
- Gmail push: https://developers.google.com/workspace/gmail/api/guides/push
- Cloud Tasks overview: https://cloud.google.com/tasks/docs
- Firestore transactions: https://firebase.google.com/docs/firestore/manage-data/transactions
- Cloud Run: https://cloud.google.com/run/docs
