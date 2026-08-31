# Internal API Reference

Because ActionOS leverages an asynchronous background execution engine, the Next.js API acts primarily as an ingress point. It validates user requests, authenticates tokens, creates database records, and offloads heavy lifting to Cloud Tasks.

This document details the internal REST API contracts between the frontend, Cloud Tasks, and the background workers.

---

## 1. Client-to-Server Endpoints (Synchronous)

These endpoints are called by the Next.js React frontend. They require a valid Firebase Auth `Bearer` token in the `Authorization` header.

### `POST /api/missions`
Creates a new mission and enqueues the initial execution task.

* **Headers:** `Authorization: Bearer <JWT>`
* **Request Body:**
```json
{
  "goal": "Review the latest expense reports",
  "priority": "HIGH",
  "metadata": {
    "reportId": "rep_12345"
  }
}
```
* **Response (200 OK):**
```json
{
  "missionId": "mis_abc123",
  "state": "READY"
}
```

### `POST /api/missions/:missionId/intervene`
Allows an authorized human to unblock a mission that is paused in the `NEEDS_ATTENTION` state.

* **Headers:** `Authorization: Bearer <JWT>`
* **Request Body:**
```json
{
  "decision": "APPROVED",
  "context": "Use the corporate checking account."
}
```
* **Response (200 OK):**
```json
{
  "status": "RESUMED",
  "taskId": "task_xyz789"
}
```

---

## 2. Server-to-Server Endpoints (Asynchronous Workers)

These endpoints are strictly for background processing. They **do not** accept client JWTs. Instead, they require an **OIDC token** issued by Google Cloud Tasks. They will reject any request lacking a valid `actionos-tasks@...` service account signature.

### `POST /api/internal/tasks/run-mission`
The primary workhorse of ActionOS. This endpoint wakes up the Genkit agent, evaluates the mission's current state, plans the next step, executes a capability, and goes back to sleep.

* **Headers:**
  * `Authorization: Bearer <OIDC_TOKEN>`
  * `X-CloudTasks-QueueName: actionos-missions`
* **Request Body:**
```json
{
  "missionId": "mis_abc123",
  "attempt": 1
}
```
* **Behavior:**
  * If the agent fires a tool, it updates the state to `WAITING_EXTERNAL` and returns `200 OK` (so Cloud Tasks deletes the task).
  * If the agent fails, it throws a `500`, causing Cloud Tasks to automatically retry with exponential backoff.

### `POST /api/internal/tasks/analyze-case`
Used by the `wake-reconciler` cron job. Periodically sweeps the database for missions that have exceeded their timeout thresholds or require background cleanup without user interaction.

---

## 3. Webhooks (External Ingress)

These endpoints listen for incoming data from third-party systems (like Resend). They rely on cryptographic payload signing rather than Bearer tokens.

### `POST /api/webhooks/resend`
Receives inbound emails from customers/counterparties.

* **Headers:** `svix-signature: v1,whsec_...`
* **Request Body:** Standard Resend Webhook payload.
* **Behavior:**
  1. Validates the signature using `EMAIL_WEBHOOK_SIGNING_SECRET`.
  2. Extracts the `missionId` from the email threading context.
  3. Writes the email body to the `events` ledger as evidence.
  4. Enqueues a `run-mission` Cloud Task to wake the agent up so it can evaluate the reply.

### `POST /api/sandbox/webhook`
A controlled webhook receiver for testing the `CONTROLLED_SANDBOX` capability locally.
* **Headers:** `X-ActionOS-Signature: <hmac>`
