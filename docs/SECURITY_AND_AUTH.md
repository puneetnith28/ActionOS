# Security & Authentication

Because ActionOS grants an autonomous agent the power to modify external systems (e.g., sending emails or interacting with billing APIs), security is paramount. This document outlines the multi-layered security architecture of ActionOS.

---

## 1. Firebase Authentication (Client-Side)

ActionOS uses **Firebase Authentication** to manage user identities securely without storing passwords directly in our database.

* **Identity Providers:** The platform supports both Email/Password authentication and Google OAuth Sign-In.
* **Token Lifecycle:** When a user logs in, Firebase generates a secure JWT (JSON Web Token). This token is automatically refreshed by the Firebase Client SDK.
* **Route Protection:** In the Next.js frontend, an `AuthGuard` component enforces authentication. If a user without a valid session attempts to access the dashboard (`/dashboard`), they are automatically redirected to the `/login` route.

---

## 2. API Authorization (Server-Side)

When the frontend needs to trigger an action (e.g., creating a new mission), it sends an HTTP POST request to the Next.js API routes (`/api/missions/*`).

1. **Token Extraction:** The Next.js API extracts the `Authorization: Bearer <token>` header.
2. **Token Verification:** The backend uses the Firebase Admin SDK to cryptographically verify the JWT against Google's public keys.
3. **Context Injection:** Once verified, the user's `uid` is injected into the server-side context, ensuring that the user can only create or modify missions attached to their own account.

---

## 3. Firestore Security Rules

Even if a malicious actor attempts to bypass the Next.js API and communicate directly with the Firestore database via the client SDK, they are blocked by strict Firestore Security Rules.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users can only read and write their own active mission runs
    match /missionRuns/{missionId} {
      allow read: if request.auth != null && resource.data.ownerId == request.auth.uid;
      // Clients cannot create runs directly; they must use the secure Next.js API
      allow create, update, delete: if false; 
    }

    // The events ledger is strictly read-only for clients
    match /missionRuns/{missionId}/events/{eventId} {
      allow read: if request.auth != null && get(/databases/$(database)/documents/missionRuns/$(missionId)).data.ownerId == request.auth.uid;
      allow write: if false;
    }
  }
}
```

---

## 4. Background Worker Security (Cloud Tasks)

The Background Workers (`/api/internal/tasks/*`) are public-facing URLs on Cloud Run, meaning they could theoretically be triggered by anyone. ActionOS secures them using **OIDC (OpenID Connect)**.

1. **IAM Service Account:** ActionOS uses a dedicated Service Account (e.g., `actionos-tasks@...`).
2. **Enqueuing:** When the Next.js API enqueues a Cloud Task, it attaches the Service Account's identity to the task.
3. **Execution:** When Cloud Tasks hits the Webhook, it includes an OIDC token in the `Authorization` header.
4. **Validation:** The Next.js worker route verifies that the token was signed by Google, that the audience matches the app URL, and that the email matches the authorized Service Account. **If any check fails, the request is rejected with a 401 Unauthorized.**

---

## 5. Secrets Management

ActionOS never commits sensitive secrets (API keys, webhook signing secrets, etc.) to version control.

* **Local Development:** Secrets are kept in a `.env` file that is strictly ignored in `.gitignore`.
* **Production:** Secrets are stored in **Google Secret Manager**. During deployment, Cloud Build maps these secrets directly to the Cloud Run container's memory as environment variables, preventing them from being exposed in plaintext configurations or Cloud Logging.
