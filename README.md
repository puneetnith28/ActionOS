# ActionOS

**AI that takes action, not just instructions.**

ActionOS is an autonomous AI execution platform that translates natural-language goals into concrete, multi-step operations. Instead of merely generating conversational text, ActionOS interacts with live systems, triggers background workflows, evaluates outcomes, and persists state reliably until the assigned mission is accomplished.

## Core Philosophy

ActionOS operates on the **Mission** paradigm:
1. **Understand:** Parse complex user intent, requirements, and constraints.
2. **Plan:** Decompose the high-level goal into sequential and parallel execution steps.
3. **Execute:** Select and invoke the appropriate capabilities (tools) to affect system state.
4. **Observe:** Gather evidence and responses from external systems.
5. **Verify:** Conclusively determine if the objective was met based on structured evidence.
6. **Complete:** Record the verifiable outcome to persistent execution memory.

## Architecture & Infrastructure

ActionOS is designed for resilience, utilizing a highly durable asynchronous architecture powered by Google Cloud:
- **Agent Brain:** Google Genkit + Gemini 3.5 (Vertex AI) handles complex planning, reasoning, and result verification.
- **State & Memory:** Firestore maintains optimistic concurrency for durable mission states and execution history.
- **Execution Loop:** Cloud Tasks ensures long-running agent workflows can "sleep" and wake up reliably without blocking UI threads or hitting request timeouts.
- **Action Runtime:** Modular Node.js microservices manage side-effects, idempotency, and secure capability routing.

## Development

ActionOS is a `pnpm` monorepo. It requires an active Google Cloud Platform (GCP) project with Vertex AI, Firestore, and Cloud Tasks enabled.

### Workspace Structure

- `apps/web/`: The ActionOS Mission Control Operations Console (Next.js 15+).
- `packages/domain/`: Immutable core logic, state reducers, and domain types.
- `packages/genkit-flows/`: Gemini-powered planning, execution, and verification workflows.
- `packages/runtime/`: The asynchronous background execution engine (`MissionRunner` & `ActionBroker`).
- `packages/persistence/`: Firestore repositories and state management.
- `packages/contracts/`: Shared schemas, data structures, and OpenAPI specifications.

## Setup & Deployment

For detailed instructions on running ActionOS, please refer to our setup documentation:
- **[Local Setup & Development](Setup.md)**: Instructions for running the Next.js console, Firestore emulator, and configuring your local environment.
- **[Google Cloud Deployment](Deployment.md)**: Instructions for provisioning infrastructure and deploying ActionOS to Google Cloud Run for a production environment.

---
*ActionOS — Autonomy you can trust.*