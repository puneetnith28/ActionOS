# ActionOS Environment Configuration

ActionOS relies on a strict set of environment variables to manage Google Cloud permissions, external API integrations, and internal routing. 

This document serves as the master guide for configuring your `.env` file for local development, as well as binding secrets in Google Cloud Run for production.

---

## 1. Quickstart Template

For immediate local development, copy the `.env.example` file located in the root of the repository to `.env` and fill in the missing secrets.

```bash
cp .env.example .env
```

> [!WARNING]
> **Never commit your `.env` file.** It contains sensitive API keys and signing secrets that grant autonomous execution privileges.

---

## 2. Core Google Cloud Configuration

These variables authorize ActionOS to communicate with Vertex AI (Gemini), Firestore, and Cloud Tasks.

| Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `GOOGLE_CLOUD_PROJECT` | The ID of your Google Cloud Project. | `aerobic-flare-484319-d6` |
| `GOOGLE_CLOUD_LOCATION` | The region for Vertex AI and Cloud Tasks execution. | `us-central1` |
| `FIRESTORE_DATABASE` | The name of the Firestore database instance. | `(default)` |

---

## 3. Asynchronous Backbone (Cloud Tasks)

Because the Genkit agent executes autonomously in the background, it must know exactly which queues to push work to and what service account to impersonate.

| Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `CLOUD_TASKS_LOCATION` | Region where your Cloud Tasks queue is provisioned. | `us-central1` |
| `CLOUD_TASKS_QUEUE` | The exact name of the Cloud Tasks queue. | `actionos-missions` |
| `CLOUD_TASKS_SERVICE_ACCOUNT`| The IAM Service Account that is authorized to enqueue tasks. | `actionos-tasks@aerobic-flare-484319-d6.iam.gserviceaccount.com` |

---

## 4. Internal Routing & Webhooks

The Background Worker needs absolute URLs to send asynchronous HTTP POST requests to itself. 

> [!NOTE]
> In production, these should point to your public Cloud Run URL. Locally, they should point to your `localhost` tunnel (e.g., ngrok) so Cloud Tasks can reach your local machine.

| Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `APP_BASE_URL` | The root URL of the Next.js console. | `http://localhost:3000` |
| `ACTIONOS_PUBLIC_BASE_URL` | The public-facing domain used in emails/notifications. | `https://aerobic-flare-484319-d6.web.app` |
| `ACTIONOS_WORKER_URL` | Route for mission execution steps. | `http://localhost:3000/api/internal/tasks/run-mission` |
| `ACTIONOS_ANALYSIS_WORKER_URL`| Route for analyzing unstructured responses. | `http://localhost:3000/api/internal/tasks/analyze-case` |

---

## 5. Agent Capabilities & Integrations

These secrets authorize the agent to execute specific programmatic actions. If a block is missing, the agent will gracefully disable that capability in the UI.

### Managed Email Integration (Resend)
| Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `RESEND_API_KEY` | API key from resend.com for outbound emails. | `re_123456789...` |
| `COMPANY_EMAIL_FROM` | The sender address the agent uses. | `agent@actionos.dev` |
| `COMPANY_EMAIL_REPLY_DOMAIN` | Domain for routing inbound replies back to the agent. | `reply.actionos.dev` |
| `EMAIL_WEBHOOK_SIGNING_SECRET`| Cryptographic secret to verify inbound Resend webhooks. | `whsec_...` |
| `COMPANY_EMAIL_ALLOWED_RECIPIENT_DOMAINS`| Comma-separated allowlist of domains the agent can email. | `example.com,test.com` |

### Merchant Sandbox Integration
| Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `MERCHANT_SANDBOX_URL` | Root URL for the sandbox API simulation. | `http://localhost:3000/api/sandbox` |
| `MERCHANT_CALLBACK_SECRET` | Secret used to sign sandbox callback webhooks. | `secure-random-string` |
| `MERCHANT_SANDBOX_RECIPIENT` | A test recipient ID used internally. | `usr_test123` |

### Partner API (External Webhooks)
| Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `PARTNER_FIXTURE_ENDPOINT` | External webhook endpoint for partner actions. | `https://api.partner.com/v1/trigger` |
| `PARTNER_FIXTURE_SIGNING_SECRET`| Secret to sign partner payloads. | `ptnr_sec_...` |

---

## 6. Client-Side Firebase Keys

These variables are safe to expose to the browser (`NEXT_PUBLIC_...` internally) and are required for the Next.js frontend to authenticate users via Firebase Auth.

| Variable | Description | Example / Required Value |
| :--- | :--- | :--- |
| `FIREBASE_WEB_API_KEY` | Public API key from Firebase Console. | `AIzaSyB...` |
| `FIREBASE_AUTH_DOMAIN` | Firebase authentication domain. | `aerobic-flare-484319-d6.firebaseapp.com` |
| `FIREBASE_APP_ID` | Firebase unique app identifier. | `1:767621068378:web:abcdef` |

---

## Production Security Notes

When deploying ActionOS to **Google Cloud Run**, do **not** configure sensitive variables (like `RESEND_API_KEY` or `EMAIL_WEBHOOK_SIGNING_SECRET`) as raw environment variables in the Cloud Run console.

Instead, store them in **Google Secret Manager** and mount them to the container at runtime. This prevents secrets from leaking into Cloud Logging or being exposed to users with read-only access to the Cloud Run configuration.
