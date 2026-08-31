# Local Development Guide

This document describes how to set up the ActionOS repository for local development, run the necessary background simulators, and contribute to the monorepo.

---

## 1. Prerequisites

- **Node.js:** >= 22
- **Package Manager:** `pnpm` (latest)
- **Firebase CLI:** Installed globally (`npm i -g firebase-tools`)
- **GCP Credentials:** Application Default Credentials configured via `gcloud auth application-default login`. (Required for local Genkit to communicate with Vertex AI).

---

## 2. Environment Configuration

ActionOS requires a populated `.env` file in the root of the repository to run locally.

1. Copy the example template: `cp .env.example .env`
2. Fill in your specific `GOOGLE_CLOUD_PROJECT` and Firebase configuration keys.
3. Keep `APP_BASE_URL` and `ACTIONOS_WORKER_URL` pointing to `http://localhost:3000`.

*(For a detailed breakdown of every variable, see [Environment Configuration](ENVIRONMENT.md)).*

---

## 3. Running the Local Stack

Because ActionOS relies heavily on Firestore for its event ledger and state machines, you **must** run the Firebase Emulator locally alongside the Next.js development server.

### Step 1: Start the Emulators
In your terminal, start the Firestore and Auth emulators:
```bash
pnpm run emulators
```
*Alternatively, you can run `firebase emulators:start --only firestore,ui`.*

### Step 2: Start Next.js
In a separate terminal window, launch the Next.js development server:
```bash
pnpm run dev
```

The Mission Control Operations Console will now be accessible at `http://localhost:3000`.

---

## 4. Simulating Cloud Tasks Locally

In production, Google Cloud Tasks handles the asynchronous polling of `/api/internal/tasks/run-mission`.

Because Cloud Tasks cannot easily route to `localhost` without a tunnel (like `ngrok`), ActionOS includes a local polyfill script that simulates the Cloud Tasks queue.

To process background missions locally during development:
1. Ensure the Next.js dev server is running.
2. In a new terminal window, execute the task processor script:
```bash
pnpm run process-tasks:local
```
This script will continually poll your local database for `READY` or `VERIFYING` missions and manually send the HTTP POST request to your local Next.js worker route, simulating the exact behavior of Cloud Tasks.
