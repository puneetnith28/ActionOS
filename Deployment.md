# ActionOS Cloud Deployment

ActionOS is designed for production on Google Cloud Run and Google Cloud Tasks. This document explains how to deploy the platform to a new Google Cloud Project.

## 1. Prerequisites
- Google Cloud CLI (`gcloud`) installed and authenticated
- A Google Cloud Project with Billing Enabled

## 2. Google Cloud Setup
Enable the required APIs for the project. In your terminal, run:

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

## 3. Production Deployment

ActionOS provides an automated deployment script to provision infrastructure, build Docker images, configure Cloud Tasks, and deploy services to Google Cloud Run.

To deploy ActionOS to your GCP project, export the required configuration values to your environment and run the deployment script:

```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export MERCHANT_CALLBACK_SECRET="generate-a-secure-random-string"
export FIREBASE_WEB_API_KEY="your-firebase-web-api-key"
export FIREBASE_AUTH_DOMAIN="your-firebase-auth-domain"
export FIREBASE_APP_ID="your-firebase-app-id"

# Run the automated deployment script
./infra/cloud-run/deploy.sh
```

### What the Deployment Script Does

The deployment script handles the following infrastructure and configuration updates automatically:

- **Infrastructure Provisioning:** Provisions a Google Artifact Registry, Google Cloud Run services, Google Cloud Tasks queue, and Google Secret Manager secrets.
- **IAM Identity:** Creates the necessary IAM service accounts (`actionos-runtime`, `actionos-tasks`, `actionos-sandbox`) and binds roles like Cloud Task Enqueuer, Firestore User, and Vertex AI User.
- **Cloud Tasks & Scheduler:** Creates the `actionos-missions` queue and the `actionos-wake-reconciler` Cloud Scheduler job.
- **Builds and Deployments:** Builds the `actionos-web` and `actionos-merchant-sandbox` Docker images and deploys the runtimes to Google Cloud Run with proper environment variables and secret bindings.

Once the script completes, it will output the public URL of your newly deployed ActionOS console.
