# Google Cloud Deployment Guide

ActionOS is strictly designed to be deployed on **Google Cloud Run** with **Firebase Hosting** acting as the global CDN and router. This document outlines the exact deployment workflow to transition from local development to a production environment.

---

## 1. Prerequisites

Before attempting to deploy, ensure you have the following:
* Google Cloud CLI (`gcloud`) installed and authenticated.
* Firebase CLI (`firebase-tools`) installed.
* An active Google Cloud Project (e.g., `aerobic-flare-484319-d6`).
* **Billing Enabled:** Google Cloud Run and Artifact Registry strictly require an active billing account, even if your usage falls entirely within the free tier.

---

## 2. Infrastructure Setup (First Time Only)

ActionOS utilizes several managed services that must be enabled before deployment.

Run the following command to enable the necessary APIs:
```bash
gcloud services enable \
  aiplatform.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  run.googleapis.com \
  cloudtasks.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  identitytoolkit.googleapis.com
```

---

## 3. Deployment Flow & Architecture

ActionOS leverages a highly optimized serverless routing flow:
```text
Firebase Hosting (CDN) ➡️ Cloud Run (actionos-web) ➡️ Next.js / API Routes
```

This ensures static assets are cached globally by Firebase, while all dynamic Next.js routes and API endpoints are forwarded to the autoscaling Cloud Run container.

---

## 4. Deploying to Cloud Run

We utilize Google **Cloud Build** to containerize the Next.js application based on the configuration defined in `infra/cloud-run/cloudbuild.yaml`.

### Step 1: Push the Image
To build and push the Docker image to Artifact Registry, run:
```bash
gcloud builds submit --config infra/cloud-run/cloudbuild.yaml
```

### Step 2: Configure Secrets
Ensure all production secrets (e.g., `RESEND_API_KEY`) are stored in Google Secret Manager. Do not commit these to a `.env.production` file.

### Step 3: Deploy the Service
Once the image is built, deploy it to Cloud Run:
```bash
gcloud run deploy actionos-web \
  --image us-central1-docker.pkg.dev/<PROJECT_ID>/actionos/web:manual \
  --region us-central1 \
  --allow-unauthenticated
```
*(Note: Cloud Run is publicly accessible so Firebase Hosting can route traffic to it; however, all sensitive API routes are secured via JWTs and OIDC tokens).*

---

## 5. Deploying Firebase Hosting

Once `actionos-web` is running successfully on Cloud Run, you must configure Firebase Hosting to act as the front door.

Check your `firebase.json` file. It should contain a rewrite rule directing all traffic to the Cloud Run service:
```json
"rewrites": [
  {
    "source": "**",
    "run": {
      "serviceId": "actionos-web",
      "region": "us-central1"
    }
  }
]
```

To deploy this configuration, run:
```bash
firebase deploy --only hosting
```

Your production ActionOS environment will now be live at `https://<PROJECT_ID>.web.app`!
