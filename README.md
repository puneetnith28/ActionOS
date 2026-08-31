# ActionOS

> **AI that takes action, not just instructions.**

![ActionOS Platform](https://images.unsplash.com/photo-1639322537504-6427a16b0a28?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80)

ActionOS is an **autonomous AI execution platform** that transforms natural-language goals into concrete, multi-step operations. Instead of merely generating conversational text, ActionOS interacts with live systems, triggers background workflows, evaluates outcomes, and persists state reliably until the assigned mission is accomplished.

It is **architected** for production environments requiring high resilience, idempotent capabilities, and deterministic state management using Google Cloud's serverless ecosystem.

> [!NOTE]
> **Deployment Status:** The application is currently fully runnable and testable in a local development environment using Firebase Emulators. While the codebase is fully prepared for Google Cloud Run (and documentation is provided), a live production deployment cannot be provisioned until a Google Cloud Billing account is attached to the project.

---

## 🌟 Core Philosophy

ActionOS operates on the **Mission** paradigm—a strict lifecycle designed for safe, asynchronous execution:

1. **Understand:** Parse complex user intent, requirements, and constraints.
2. **Plan:** Decompose the high-level goal into sequential and parallel execution steps.
3. **Execute:** Select and invoke the appropriate capabilities (tools) to affect system state securely.
4. **Observe:** Gather evidence and wait for responses from external systems.
5. **Verify:** Conclusively determine if the objective was met based on structured evidence.
6. **Complete:** Record the verifiable outcome to persistent execution memory.

---

## 🏗 Architecture & Infrastructure

ActionOS is built on a highly durable, asynchronous event-driven architecture powered by Google Cloud:

- **Agent Brain:** Powered by Google **Genkit + Gemini 1.5 Pro / 3.5 Flash** (Vertex AI) for complex planning, reasoning, and result verification.
- **State & Memory:** **Firestore** acts as the persistent execution memory, maintaining optimistic concurrency for durable mission states.
- **Execution Loop:** **Cloud Tasks** ensures long-running agent workflows can "sleep" and wake up reliably without blocking UI threads or hitting request timeouts.
- **Action Runtime:** Modular Node.js microservices manage side-effects, idempotency, and secure capability routing.
- **Interface:** A premium, Glassmorphism-styled **Next.js** application serving as the Mission Control Operations Console.

*(For a deep dive into the system design and Mermaid diagrams, see the [Architecture Documentation](docs/ARCHITECTURE.md)).*

---

## 📂 Workspace Structure

ActionOS is structured as a robust `pnpm` monorepo:

- **`apps/web/`**: The ActionOS Mission Control Operations Console (Next.js 15+, Tailwind CSS, Shadcn).
- **`packages/domain/`**: Immutable core logic, state reducers, and domain types.
- **`packages/genkit-flows/`**: Gemini-powered planning, execution, and verification workflows.
- **`packages/runtime/`**: The asynchronous background execution engine (`MissionRunner` & `ActionBroker`).
- **`packages/persistence/`**: Firestore repositories and state management.
- **`packages/contracts/`**: Shared schemas, data structures, and internal APIs.

---

## 🌟 Key Features

- **True Autonomy, No Chatbots:** The UI does not contain a conversational chat box. You provide a goal (e.g., "Review the latest policy"), and the agent performs background operations to fulfill it.
- **Glassmorphism Design System:** The entire Next.js operations console is built with a highly polished, custom Shadcn-UI design system that favors calm, dark-mode aesthetics over flashy clutter.
- **Human-in-the-Loop (Intervention):** If the agent detects high risk or ambiguity in its execution plan, it intentionally suspends execution (state: `NEEDS_ATTENTION`) and pings an administrator for approval.
- **Durable Execution (Sleep/Wake):** By leveraging Google Cloud Tasks, the agent can sleep for days while waiting for an external webhook (like a customer email reply) and wake up exactly where it left off, avoiding server timeouts.
- **Deterministic Event Ledger:** Every agent action, verification result, and state transition is stored in a sequential, cryptographically hashed event ledger in Firestore.

---

## 🛠️ Built-In Capabilities

ActionOS comes with several highly isolated tools (Capabilities) that the Genkit agent can route to dynamically:

1. **Managed Email Gateway (`MANAGED_EMAIL`):** The agent can construct and parse secure outbound/inbound email threads (via Resend) without exposing raw API keys to the LLM.
2. **Merchant Sandbox (`CONTROLLED_SANDBOX`):** A safe, simulated internal API environment for the agent to test communication workflows and parse strict JSON responses deterministically.
3. **External Webhooks (`PARTNER_API`):** Direct, authorized programmatic access to ActionOS partner endpoints for immediate ticket resolution.

---

## 🚀 Getting Started

To run ActionOS on your machine (the currently supported method) or to review the steps for a future Google Cloud deployment, we have separated our configuration guides:

- **[Local Development & Setup Guide](docs/DEVELOPMENT_GUIDE.md)**: Full instructions on installing dependencies, running the Firebase Emulator, and starting the Next.js console locally.
- **[Environment Variables & Secrets](docs/ENVIRONMENT.md)**: A complete master list of all required `.env` variables, API keys, and service account configs.

---

## 📚 Comprehensive Documentation Suite

We have thoroughly documented every aspect of ActionOS in the `docs/` directory. Whether you are expanding the agent's capabilities, modifying the data model, or deploying to production, these guides will provide deep technical context.

1. **[Architecture & Topology](docs/ARCHITECTURE.md)**: Deep dive into the system topology, including Frontend, Firebase, Cloud Tasks, and the Gemini Agent worker.
2. **[Agent Runtime & Genkit](docs/AGENT_RUNTIME.md)**: Detailed explanation of the Genkit integration, dynamic planning, and capability registries.
3. **[Data Model & State Machines](docs/DATA_MODEL.md)**: Comprehensive breakdown of the Firestore schema and mission lifecycle states.
4. **[Security & Authentication](docs/SECURITY_AND_AUTH.md)**: Documentation on Firebase Auth, Firestore Security Rules, and secure API routing.
5. **[UI & Design System](docs/UI_DESIGN_SYSTEM.md)**: Overview of the Shadcn-based architecture, Glassmorphism aesthetic, and Tailwind setup.
6. **[API Reference](docs/API_REFERENCE.md)**: Internal Next.js API routes and the contract between frontend and background workers.
7. **[Deployment Guide](docs/DEPLOYMENT.md)**: The exact deployment topology, GCP requirements, Cloud Run deployment, and environment variables.
8. **[Development Guide](docs/DEVELOPMENT_GUIDE.md)**: Local setup instructions, testing background workers, and contribution guidelines.
9. **[Environment Configuration](docs/ENVIRONMENT.md)**: The master template and deep-dive explanation for all required API keys and secrets.

---

*ActionOS — Autonomy you can trust.*