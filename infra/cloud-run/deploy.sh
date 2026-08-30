#!/usr/bin/env bash
set -euo pipefail

project_id="${GOOGLE_CLOUD_PROJECT:?Set GOOGLE_CLOUD_PROJECT}"
region="${GOOGLE_CLOUD_LOCATION:-us-central1}"
repository="${ARTIFACT_REPOSITORY:-actionos}"
runtime_sa="actionos-runtime@${project_id}.iam.gserviceaccount.com"
tasks_sa="actionos-tasks@${project_id}.iam.gserviceaccount.com"
sandbox_sa="actionos-sandbox@${project_id}.iam.gserviceaccount.com"
callback_secret="${MERCHANT_CALLBACK_SECRET:?Set MERCHANT_CALLBACK_SECRET}"
firebase_api_key="${FIREBASE_WEB_API_KEY:?Set FIREBASE_WEB_API_KEY}"
firebase_auth_domain="${FIREBASE_AUTH_DOMAIN:?Set FIREBASE_AUTH_DOMAIN}"
firebase_app_id="${FIREBASE_APP_ID:?Set FIREBASE_APP_ID}"
image_tag="$(git rev-parse --short HEAD)"
artifact_bucket="${ACTIONOS_ARTIFACT_BUCKET:-${project_id}-actionos-artifacts}"

gcloud services enable \
  aiplatform.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com \
  firestore.googleapis.com run.googleapis.com cloudtasks.googleapis.com \
  cloudscheduler.googleapis.com \
  storage.googleapis.com \
  secretmanager.googleapis.com identitytoolkit.googleapis.com firebaserules.googleapis.com \
  --project="${project_id}"

gcloud artifacts repositories describe "${repository}" --location="${region}" --project="${project_id}" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "${repository}" --repository-format=docker --location="${region}" --project="${project_id}"

gcloud iam service-accounts describe "${runtime_sa}" --project="${project_id}" >/dev/null 2>&1 || \
  gcloud iam service-accounts create actionos-runtime --display-name="ActionOS runtime" --project="${project_id}"
gcloud iam service-accounts describe "${tasks_sa}" --project="${project_id}" >/dev/null 2>&1 || \
  gcloud iam service-accounts create actionos-tasks --display-name="ActionOS Cloud Tasks invoker" --project="${project_id}"
gcloud iam service-accounts describe "${sandbox_sa}" --project="${project_id}" >/dev/null 2>&1 || \
  gcloud iam service-accounts create actionos-sandbox --display-name="ActionOS controlled sandbox" --project="${project_id}"
gcloud iam service-accounts add-iam-policy-binding "${tasks_sa}" \
  --member="serviceAccount:${runtime_sa}" --role=roles/iam.serviceAccountUser \
  --project="${project_id}" --quiet >/dev/null
project_number="$(gcloud projects describe "${project_id}" --format='value(projectNumber)')"
gcloud iam service-accounts add-iam-policy-binding "${tasks_sa}" \
  --member="serviceAccount:service-${project_number}@gcp-sa-cloudscheduler.iam.gserviceaccount.com" \
  --role=roles/iam.serviceAccountTokenCreator --project="${project_id}" --quiet >/dev/null

for role in roles/datastore.user roles/aiplatform.user roles/cloudtasks.enqueuer roles/firebaseauth.viewer; do
  gcloud projects add-iam-policy-binding "${project_id}" --member="serviceAccount:${runtime_sa}" --role="${role}" --condition=None --quiet >/dev/null
done
# Secret access is granted per secret below. Remove the legacy project-wide binding if present.
gcloud projects remove-iam-policy-binding "${project_id}" \
  --member="serviceAccount:${runtime_sa}" --role=roles/secretmanager.secretAccessor \
  --condition=None --quiet >/dev/null 2>&1 || true

gcloud storage buckets describe "gs://${artifact_bucket}" --project="${project_id}" >/dev/null 2>&1 || \
  gcloud storage buckets create "gs://${artifact_bucket}" \
    --project="${project_id}" --location="${region}" --uniform-bucket-level-access
gcloud storage buckets update "gs://${artifact_bucket}" \
  --lifecycle-file=infra/cloud-storage/artifact-lifecycle.json --project="${project_id}" >/dev/null
gcloud storage buckets add-iam-policy-binding "gs://${artifact_bucket}" \
  --member="serviceAccount:${runtime_sa}" --role=roles/storage.objectAdmin \
  --project="${project_id}" >/dev/null

gcloud firestore databases describe --database='(default)' --project="${project_id}" >/dev/null 2>&1 || \
  gcloud firestore databases create --database='(default)' --location="${region}" --type=firestore-native --project="${project_id}"

GOOGLE_CLOUD_PROJECT="${project_id}" pnpm --filter @actionos/web deploy:firestore-rules

if [[ -z "$(gcloud firestore indexes composite list --project="${project_id}" --filter='name:collectionGroups/interventions/' --format='value(name)')" ]]; then
  gcloud firestore indexes composite create \
    --project="${project_id}" \
    --collection-group=interventions \
    --query-scope=collection \
    --field-config=field-path=caseId,order=ascending \
    --field-config=field-path=createdAt,order=ascending >/dev/null
fi

if [[ -z "$(gcloud firestore indexes composite list --project="${project_id}" --filter='name:collectionGroups/notifications/' --format='value(name)')" ]]; then
  gcloud firestore indexes composite create \
    --project="${project_id}" \
    --collection-group=notifications \
    --query-scope=collection \
    --field-config=field-path=caseId,order=ascending \
    --field-config=field-path=createdAt,order=ascending >/dev/null
fi

for collection_group in caseDrafts intakeDedupe analysisJobs analysisDedupe caseRuns evidence events notifications interventions caseControlCommands deletionTombstones securityBudgets modelUsage actionRecords actionFailures callbackDedupe emailDeliveries messageThreads providerEvents inboundEnvelopes externalSendBudgets externalSendReservations wakeIntents; do
  ttl_state="$(gcloud firestore fields ttls list --project="${project_id}" --collection-group="${collection_group}" --format='value(ttlConfig.state)' 2>/dev/null || true)"
  if [[ "${ttl_state}" != "ACTIVE" ]]; then
    gcloud firestore fields ttls update deleteAt \
      --project="${project_id}" \
      --collection-group="${collection_group}" \
      --enable-ttl \
      --async >/dev/null
  fi
done

gcloud tasks queues describe actionos-cases --location="${region}" --project="${project_id}" >/dev/null 2>&1 || \
  gcloud tasks queues create actionos-cases --location="${region}" --max-dispatches-per-second=2 --max-concurrent-dispatches=2 --max-attempts=5 --min-backoff=10s --max-backoff=300s --project="${project_id}"

if gcloud secrets describe actionos-merchant-callback --project="${project_id}" >/dev/null 2>&1; then
  printf '%s' "${callback_secret}" | gcloud secrets versions add actionos-merchant-callback --data-file=- --project="${project_id}" >/dev/null
else
  printf '%s' "${callback_secret}" | gcloud secrets create actionos-merchant-callback --replication-policy=automatic --data-file=- --project="${project_id}" >/dev/null
fi

gcloud secrets add-iam-policy-binding actionos-merchant-callback \
  --member="serviceAccount:${runtime_sa}" --role=roles/secretmanager.secretAccessor \
  --project="${project_id}" --quiet >/dev/null
gcloud secrets add-iam-policy-binding actionos-merchant-callback \
  --member="serviceAccount:${sandbox_sa}" --role=roles/secretmanager.secretAccessor \
  --project="${project_id}" --quiet >/dev/null

gcloud builds submit --config=infra/cloud-run/cloudbuild.yaml --substitutions="_REGION=${region},_REPOSITORY=${repository},_TAG=${image_tag}" --project="${project_id}" .

sandbox_image="${region}-docker.pkg.dev/${project_id}/${repository}/merchant-sandbox:${image_tag}"
web_image="${region}-docker.pkg.dev/${project_id}/${repository}/web:${image_tag}"

# The controlled sandbox emits signed callbacks after its 202 response. Keep CPU
# allocated so Cloud Run does not suspend that bounded background delivery.
gcloud run deploy actionos-merchant-sandbox --image="${sandbox_image}" --region="${region}" --service-account="${sandbox_sa}" --allow-unauthenticated --no-cpu-throttling --set-secrets="MERCHANT_CALLBACK_SECRET=actionos-merchant-callback:latest" --project="${project_id}"
sandbox_url="$(gcloud run services describe actionos-merchant-sandbox --region="${region}" --project="${project_id}" --format='value(status.url)')"

gcloud run deploy actionos-web --image="${web_image}" --region="${region}" --service-account="${runtime_sa}" --allow-unauthenticated --set-env-vars="GOOGLE_CLOUD_PROJECT=${project_id},GOOGLE_CLOUD_LOCATION=global,CLOUD_TASKS_LOCATION=${region},CLOUD_TASKS_QUEUE=actionos-cases,CLOUD_TASKS_SERVICE_ACCOUNT=${tasks_sa},ACTIONOS_ARTIFACT_BUCKET=${artifact_bucket},MERCHANT_SANDBOX_URL=${sandbox_url},MERCHANT_SCENARIO=signed-completion,FIREBASE_WEB_API_KEY=${firebase_api_key},FIREBASE_AUTH_DOMAIN=${firebase_auth_domain},FIREBASE_APP_ID=${firebase_app_id}" --set-secrets="MERCHANT_CALLBACK_SECRET=actionos-merchant-callback:latest" --project="${project_id}"
web_url="$(gcloud run services describe actionos-web --region="${region}" --project="${project_id}" --format='value(status.url)')"
public_base_url="${ACTIONOS_PUBLIC_BASE_URL:-${web_url}}"

gcloud run services update actionos-web --region="${region}" --update-env-vars="APP_BASE_URL=${public_base_url},ACTIONOS_PUBLIC_BASE_URL=${public_base_url},ACTIONOS_WORKER_URL=${web_url}/api/internal/tasks/run-case,ACTIONOS_ANALYSIS_WORKER_URL=${web_url}/api/internal/tasks/analyze-case,ACTIONOS_TASKS_OIDC_AUDIENCE=${web_url}" --project="${project_id}" >/dev/null

# Managed email is opt-in and fail-closed. The sandbox deploy remains reproducible without these
# external credentials. To enable it, provision both named secrets and set every bounded channel
# variable below; otherwise the capability endpoint reports email as unavailable.
if gcloud secrets describe actionos-resend-api-key --project="${project_id}" >/dev/null 2>&1 && \
   gcloud secrets describe actionos-email-webhook-signing --project="${project_id}" >/dev/null 2>&1 && \
   [[ -n "${COMPANY_EMAIL_FROM:-}" && -n "${COMPANY_EMAIL_REPLY_DOMAIN:-}" && \
      -n "${COMPANY_EMAIL_ALLOWED_RECIPIENT_DOMAINS:-}" ]]; then
  gcloud secrets add-iam-policy-binding actionos-resend-api-key \
    --member="serviceAccount:${runtime_sa}" --role=roles/secretmanager.secretAccessor \
    --project="${project_id}" --quiet >/dev/null
  gcloud secrets add-iam-policy-binding actionos-email-webhook-signing \
    --member="serviceAccount:${runtime_sa}" --role=roles/secretmanager.secretAccessor \
    --project="${project_id}" --quiet >/dev/null
  gcloud run services update actionos-web \
    --region="${region}" \
    --project="${project_id}" \
    --update-secrets="RESEND_API_KEY=actionos-resend-api-key:latest,EMAIL_WEBHOOK_SIGNING_SECRET=actionos-email-webhook-signing:latest" \
    --update-env-vars="COMPANY_CONTACT_MODE=email,COMPANY_EMAIL_FROM=${COMPANY_EMAIL_FROM},ACTIONOS_NOTIFICATION_FROM=${ACTIONOS_NOTIFICATION_FROM:-${COMPANY_EMAIL_FROM}},COMPANY_EMAIL_REPLY_DOMAIN=${COMPANY_EMAIL_REPLY_DOMAIN},COMPANY_EMAIL_ALLOWED_RECIPIENT_DOMAINS=${COMPANY_EMAIL_ALLOWED_RECIPIENT_DOMAINS}" \
    >/dev/null
fi
gcloud run services update actionos-merchant-sandbox --region="${region}" --update-env-vars="ACTIONOS_CALLBACK_URL=${web_url}/api/callbacks/merchant" --project="${project_id}" >/dev/null
gcloud run services add-iam-policy-binding actionos-web --region="${region}" --member="serviceAccount:${tasks_sa}" --role=roles/run.invoker --project="${project_id}" >/dev/null

reconcile_url="${web_url}/api/internal/tasks/reconcile-wakes"
if gcloud scheduler jobs describe actionos-wake-reconciler --location="${region}" --project="${project_id}" >/dev/null 2>&1; then
  gcloud scheduler jobs update http actionos-wake-reconciler \
    --location="${region}" --project="${project_id}" --schedule='*/1 * * * *' \
    --time-zone=Etc/UTC --attempt-deadline=30s \
    --uri="${reconcile_url}" --http-method=POST \
    --oidc-service-account-email="${tasks_sa}" --oidc-token-audience="${web_url}" >/dev/null
else
  gcloud scheduler jobs create http actionos-wake-reconciler \
    --location="${region}" --project="${project_id}" --schedule='*/1 * * * *' \
    --time-zone=Etc/UTC --attempt-deadline=30s \
    --uri="${reconcile_url}" --http-method=POST \
    --oidc-service-account-email="${tasks_sa}" --oidc-token-audience="${web_url}" >/dev/null
fi

if [[ "${ACTIONOS_DEPLOY_FIREBASE_HOSTING:-0}" == "1" ]]; then
  pnpm exec firebase deploy --only hosting --project="${project_id}"
fi

printf 'ActionOS public app: %s\nCloud Run origin: %s\nMerchant sandbox (controlled demo service): %s\n' "${public_base_url}" "${web_url}" "${sandbox_url}"
