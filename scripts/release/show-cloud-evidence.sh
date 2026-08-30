#!/usr/bin/env bash
set -euo pipefail
export PATH="/home/jstor/google-cloud-sdk/bin:/home/jstor/.local/bin:/usr/local/bin:/usr/bin:/bin"

project_id="bulbasour-503317"
region="us-central1"
screen() {
  clear
  printf '\033[1;32mACTIONOS · LIVE GOOGLE CLOUD EVIDENCE\033[0m\n'
  printf '\033[2mProject %s · Region %s · 2026-08-22 UTC\033[0m\n\n' "$project_id" "$region"
}

sleep 3
screen
printf '\033[1;36m$ gcloud run services describe actionos-web --region=us-central1\033[0m\n\n'
gcloud run services describe actionos-web --region="$region" --project="$project_id" \
  --format='table(status.url:label=RUN_URL,status.latestReadyRevisionName:label=LIVE_REVISION,spec.template.spec.containers[0].image:label=DEPLOYED_IMAGE)'
printf '\n\033[1m100%% of untagged traffic · Firebase Hosting repinned\033[0m\n'
sleep 6

screen
printf '\033[1;36m$ gcloud tasks queues describe actionos-cases --location=us-central1\033[0m\n\n'
gcloud tasks queues describe actionos-cases --location="$region" --project="$project_id" \
  --format='yaml(state,rateLimits.maxConcurrentDispatches,rateLimits.maxDispatchesPerSecond,retryConfig.maxAttempts,retryConfig.minBackoff,retryConfig.maxBackoff)'
sleep 5

screen
printf '\033[1;36m$ gcloud firestore databases describe --database=(default)\033[0m\n\n'
gcloud firestore databases describe --database='(default)' --project="$project_id" \
  --format='yaml(name,locationId,type,concurrencyMode)'
sleep 5

screen
printf '\033[1;36m$ gcloud run services list --region=us-central1\033[0m\n\n'
gcloud run services list --region="$region" --project="$project_id" \
  --format='table(metadata.name:label=SERVICE,status.latestReadyRevisionName:label=LIVE_REVISION,spec.template.spec.serviceAccountName:label=SERVICE_ACCOUNT)'
printf '\n\033[1mSeparate Cloud Run services · distinct runtime identities\033[0m\n'
sleep 10
