export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  get projectId() { return requireEnv("GOOGLE_CLOUD_PROJECT"); },
  get artifactBucket() { return requireEnv("ACTIONOS_ARTIFACT_BUCKET"); },
  
  tasks: {
    get location() { return process.env.CLOUD_TASKS_LOCATION ?? "us-central1"; },
    get queue() { return process.env.CLOUD_TASKS_QUEUE ?? "actionos-cases"; },
    get serviceAccount() { return requireEnv("CLOUD_TASKS_SERVICE_ACCOUNT"); },
    get workerUrl() { return requireEnv("ACTIONOS_WORKER_URL"); },
    get analysisWorkerUrl() { return requireEnv("ACTIONOS_ANALYSIS_WORKER_URL"); },
    get oidcAudience() { return process.env.ACTIONOS_TASKS_OIDC_AUDIENCE; }
  },

  urls: {
    get base() { return requireEnv("APP_BASE_URL"); },
    get publicBaseUrl() { return process.env.ACTIONOS_PUBLIC_BASE_URL; },
    get sandbox() { return process.env.MERCHANT_SANDBOX_URL; },
    get sandboxRecipient() { return process.env.MERCHANT_SANDBOX_RECIPIENT ?? "merchant@controlled.actionos.test"; }
  },

  secrets: {
    get merchantCallback() { return process.env.MERCHANT_CALLBACK_SECRET; },
    get resendApiKey() { return process.env.RESEND_API_KEY; },
    get emailWebhookSigning() { return process.env.EMAIL_WEBHOOK_SIGNING_SECRET; }
  },

  email: {
    get from() { return process.env.COMPANY_EMAIL_FROM; },
    get notificationFrom() { return process.env.ACTIONOS_NOTIFICATION_FROM ?? process.env.COMPANY_EMAIL_FROM; },
    get replyDomain() { return process.env.COMPANY_EMAIL_REPLY_DOMAIN; },
    get allowedDomains() { return process.env.COMPANY_EMAIL_ALLOWED_RECIPIENT_DOMAINS; }
  },

  firebase: {
    get apiKey() { return requireEnv("FIREBASE_WEB_API_KEY"); },
    get authDomain() { return requireEnv("FIREBASE_AUTH_DOMAIN"); },
    get appId() { return requireEnv("FIREBASE_APP_ID"); }
  }
};
