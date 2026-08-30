# ActionOS Local Setup

This document describes how to set up the ActionOS repository for local development and testing.

## 1. Prerequisites
- Node.js >= 22
- `pnpm` >= 10.34.5
- Firebase CLI (`firebase-tools`) installed globally or accessible via npx
- Google Cloud CLI (`gcloud`) installed (only if deploying later)

## 2. Local Development Configuration
Create a `.env` file in the root directory and configure the following required variables:

```ini
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
# Application URLs
APP_BASE_URL=http://localhost:3000
ACTIONOS_WORKER_URL=http://localhost:3000/api/internal/tasks/run-mission
ACTIONOS_ANALYSIS_WORKER_URL=http://localhost:3000/api/internal/tasks/analyze-case
# Secrets (Required for testing capabilities)
MERCHANT_CALLBACK_SECRET=local-development-secret-key
FIREBASE_WEB_API_KEY=your-firebase-web-api-key
FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
FIREBASE_APP_ID=your-firebase-app-id
```

## 3. Running Locally
1. **Install dependencies:** 
   ```bash
   pnpm install
   ```
2. **Start the Firebase Emulator:** 
   The emulator provides a local instance of Firestore to test data and retention policies.
   ```bash
   firebase emulators:start --only firestore,ui
   ```
3. **Start the development server:** 
   In a separate terminal, start the Next.js development server.
   ```bash
   pnpm run dev
   ```

ActionOS should now be available locally at `http://localhost:3000`.
