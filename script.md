# ActionOS Hackathon Demo Script

## 1. Video Objective
The goal is to deliver a fast-paced, highly technical, and visually impressive demonstration of **ActionOS** for the *All Things Agentic Hackathon*. 
The video clearly differentiates ActionOS from standard conversational chatbots by proving its ability to execute durable, asynchronous background tasks using Google Cloud Tasks, Gemini, and Genkit.

Because the project cannot currently be deployed to Cloud Run due to billing constraints, this video will proudly display the **local emulator environment** combined with our meticulously documented **Architecture Diagrams** to prove the underlying system design.

## 2. Final Video Timing
- **Target Word Count:** ~710 words
- **Original Narration Duration (1x):** ~4 minutes 45 seconds (at ~150 words per minute)
- **Final Playback Duration (1.25x):** ~3 minutes 48 seconds
- **ElevenLabs Recommended Voice:** "Marcus" or "Adam" (deep, clear, confident, professional). Use a stability setting of around 40-50% for a natural, dynamic delivery.

## 3. Recording Preparation (Checklist)
Before you hit record, ensure the following:
- [ ] Terminal 1 is running `pnpm run emulators`.
- [ ] Terminal 2 is running `pnpm run dev`.
- [ ] Terminal 3 is running `pnpm run process-tasks:local` (to simulate Cloud Tasks in the background).
- [ ] You are logged into the local Next.js app (`http://localhost:3000/dashboard`).
- [ ] You have VS Code (or GitHub) open in another full-screen window, specifically showing the Mermaid diagram in `docs/ARCHITECTURE.md`.
- [ ] Hide your bookmarks bar and unrelated browser extensions.

---

## 4. Complete Timestamped Recording Plan & Narration

### [00:00–00:20] SECTION 1 — HOOK & PROBLEM
**SCREEN:** `http://localhost:3000/dashboard` (ActionOS Dashboard)
**ACTION:** Start on the main dashboard. Wait 3 seconds, then slowly move the mouse across the dark-mode Glassmorphism interface.
**NARRATION:**
"Most AI applications today are just chatbots. You type a prompt, you wait, and you get text back. But real business operations don't happen in a single chat window. Real work takes time. It involves external APIs, waiting for customer replies, and pausing for human approval. We built ActionOS for the All Things Agentic Hackathon to solve exactly this problem. ActionOS is not a chatbot. It is a durable, autonomous execution platform."

### [00:20–00:55] SECTION 2 — MISSION INTAKE
**SCREEN:** Click on "Intake" or "New Mission" in the sidebar.
**ACTION:** Type a clear, actionable goal into the mission creation form. Example: *"Review the latest internal policy update and email the summary to the engineering team."* Click Submit.
**NARRATION:**
"Instead of chat threads, ActionOS uses a 'Mission' paradigm. We give the system a high-level goal, like reviewing a policy and notifying a team. When we submit this, the frontend doesn't sit and wait for the LLM to stream a response. Instead, it instantly writes the mission to Google Cloud Firestore and enqueues a background job via Cloud Tasks. The browser is completely unblocked."

### [00:55–01:40] SECTION 3 — AGENT EXECUTION (LIVE TIMELINE)
**SCREEN:** The UI routes to `/missions/[id]` (Mission Control Detail View).
**ACTION:** Slowly scroll down the Event Timeline as new events dynamically appear. Highlight the Genkit steps appearing (Planning, Extracting, Executing).
**NARRATION:**
"Here in the Mission Control view, we can watch the agent work in real-time. ActionOS uses Google Genkit under the hood with a multi-model strategy. It uses Gemini 1.5 Pro to reason about our vague request and formulate a strict execution plan. Then, it delegates fast, deterministic tasks—like extracting JSON parameters for an API call—to Gemini 3.5 Flash. As the agent executes capabilities, like hitting our Managed Email gateway, every single step is cryptographically hashed and appended to an immutable event ledger in Firestore."

### [01:40–02:20] SECTION 4 — ARCHITECTURE & DURABILITY (THE SECRET SAUCE)
**SCREEN:** Switch windows to VS Code/GitHub showing the Mermaid.js diagram in `docs/ARCHITECTURE.md`.
**ACTION:** Zoom in slightly on the "Execution Runtime" portion of the diagram (Cloud Tasks -> Worker -> Firestore -> External Webhook).
**NARRATION:**
"The real magic of ActionOS is its architecture. Because we use Google Cloud Tasks, our agent can effectively go to sleep. If a capability requires waiting three days for a customer to reply to an email, the background worker terminates to save compute. The mission sits passively in Firestore. When the external webhook finally arrives, it triggers a new Cloud Task, waking the Genkit agent up exactly where it left off. This serverless, event-driven design means zero idle costs and infinite scalability on Google Cloud Run."

### [02:20–02:50] SECTION 5 — HUMAN-IN-THE-LOOP (INTERVENTIONS)
**SCREEN:** Switch back to the browser. Navigate to a mission in the `NEEDS_ATTENTION` state (or just view the `/status` or `/capabilities` page if you don't have a paused mission ready).
**ACTION:** Slowly mouse over the intervention/status UI.
**NARRATION:**
"But what happens when the agent gets confused, or is about to perform a destructive action? ActionOS fails safe. If the agent detects ambiguity, or repeatedly fails to generate a valid schema for a tool, it halts. It transitions the mission to a 'Needs Attention' state and pings an administrator. The agent will not consume another token of compute until a human explicitly approves the action or provides context through this UI."

### [02:50–03:25] SECTION 6 — VERIFICATION & DATA MODEL
**SCREEN:** Navigate back to a completed mission (`/missions/[id]`).
**ACTION:** Scroll to the bottom of the timeline to show the final "DONE" state and the evidence.
**NARRATION:**
"Finally, ActionOS doesn't just assume it succeeded. It actively observes the evidence returned from external APIs. It passes that evidence back into Gemini 3.5 Flash to conclusively verify if the original goal was met. Only then does the state machine transition to 'Done'. Because multiple background workers can run simultaneously, we use Firestore Transactions to apply soft-locks to these documents, completely preventing race conditions."

### [03:25–03:48] SECTION 7 — CLOSING VALUE PROP
**SCREEN:** Return to the main `/dashboard` screen.
**ACTION:** Leave the mouse still on the beautiful Glassmorphism dashboard.
**NARRATION:**
"ActionOS combines the reasoning power of Gemini with the absolute reliability of Google Cloud serverless architecture. We've replaced the fragile chat interface with a resilient, asynchronous agentic platform. Thank you for checking out ActionOS."

---

## 5. Full Continuous Narration (For ElevenLabs)

Most AI applications today are just chatbots. You type a prompt, you wait, and you get text back. But real business operations don't happen in a single chat window. Real work takes time. It involves external APIs, waiting for customer replies, and pausing for human approval. We built ActionOS for the All Things Agentic Hackathon to solve exactly this problem. ActionOS is not a chatbot. It is a durable, autonomous execution platform.

Instead of chat threads, ActionOS uses a 'Mission' paradigm. We give the system a high-level goal, like reviewing a policy and notifying a team. When we submit this, the frontend doesn't sit and wait for the LLM to stream a response. Instead, it instantly writes the mission to Google Cloud Firestore and enqueues a background job via Cloud Tasks. The browser is completely unblocked.

Here in the Mission Control view, we can watch the agent work in real-time. ActionOS uses Google Genkit under the hood with a multi-model strategy. It uses Gemini 1.5 Pro to reason about our vague request and formulate a strict execution plan. Then, it delegates fast, deterministic tasks—like extracting JSON parameters for an API call—to Gemini 3.5 Flash. As the agent executes capabilities, like hitting our Managed Email gateway, every single step is cryptographically hashed and appended to an immutable event ledger in Firestore.

The real magic of ActionOS is its architecture. Because we use Google Cloud Tasks, our agent can effectively go to sleep. If a capability requires waiting three days for a customer to reply to an email, the background worker terminates to save compute. The mission sits passively in Firestore. When the external webhook finally arrives, it triggers a new Cloud Task, waking the Genkit agent up exactly where it left off. This serverless, event-driven design means zero idle costs and infinite scalability on Google Cloud Run.

But what happens when the agent gets confused, or is about to perform a destructive action? ActionOS fails safe. If the agent detects ambiguity, or repeatedly fails to generate a valid schema for a tool, it halts. It transitions the mission to a 'Needs Attention' state and pings an administrator. The agent will not consume another token of compute until a human explicitly approves the action or provides context through this UI.

Finally, ActionOS doesn't just assume it succeeded. It actively observes the evidence returned from external APIs. It passes that evidence back into Gemini 3.5 Flash to conclusively verify if the original goal was met. Only then does the state machine transition to 'Done'. Because multiple background workers can run simultaneously, we use Firestore Transactions to apply soft-locks to these documents, completely preventing race conditions.

ActionOS combines the reasoning power of Gemini with the absolute reliability of Google Cloud serverless architecture. We've replaced the fragile chat interface with a resilient, asynchronous agentic platform. Thank you for checking out ActionOS.

---

## 6. Architecture Explanation (Diagram Instructions)
When you reach **Section 4 [01:40–02:20]**, you will switch away from the browser to show the Architecture diagram.
- **Where to find it:** Open `docs/ARCHITECTURE.md` in your IDE (VS Code) or on GitHub.
- **What to show:** Scroll to section **"3.2. Execution Runtime"** where the Mermaid Sequence Diagram is rendered (`UI -> CT -> Worker -> External -> Wake up`). 
- **Why this matters:** The hackathon judges specifically want to see Google Cloud implementation. Since we can't show the live Cloud Run console due to billing limits, this highly detailed diagram proves that we actually engineered the Cloud Tasks sleep/wake architecture.

---

## 7. Hackathon Requirement Coverage
This script is engineered to hit every judging criteria:
- **Problem & Value Prop:** Covered in Section 1 (Chatbots can't do long-running tasks).
- **Features & Agentic Behavior:** Covered in Section 3 (Planning, Execution, Event Ledgers).
- **Google Cloud Usage & Architecture:** Covered in Section 4 (Cloud Tasks, Firestore, Serverless compute, sleeping agents).
- **Technologies:** Explicitly mentions Genkit, Gemini 1.5 Pro, Gemini 3.5 Flash, Cloud Tasks, and Firestore throughout the script.
- **Human Oversight:** Covered in Section 5 (Interventions and safety).

---

## 8. Final Editing Checklist
- [ ] **Screen Recording:** Record in 1080p or 4K. Move the mouse smoothly.
- [ ] **Audio Generation:** Generate the continuous script in ElevenLabs.
- [ ] **Speed up:** Increase the audio speed by 20-25% in your video editor (Premiere/Resolve/CapCut) so it sounds energetic and fits under 4 minutes.
- [ ] **Sync:** Align your screen recording clips to the audio timestamps provided above.
- [ ] **Transitions:** Use simple cut transitions or fast cross-dissolves when switching between the Browser and the Architecture diagram.
- [ ] **B-Roll (Optional):** If you finish a UI action early, slowly scroll to show off the Glassmorphism styling while the narration finishes.
