import { createHmac, timingSafeEqual } from "node:crypto";

export interface EmailProviderEvent {
  readonly type: string;
  readonly created_at: string;
  readonly data: {
    readonly email_id: string;
    readonly from?: string;
    readonly to?: readonly string[];
    readonly subject?: string;
    readonly message_id?: string;
  };
}

function secretBytes(secret: string): Buffer {
  const encoded = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  return Buffer.from(encoded, "base64");
}

export function signEmailWebhook(body: string, id: string, timestamp: string, secret: string): string {
  return createHmac("sha256", secretBytes(secret))
    .update(`${id}.${timestamp}.${body}`)
    .digest("base64");
}

export function verifyEmailWebhook(input: {
  readonly body: string;
  readonly id: string;
  readonly timestamp: string;
  readonly signature: string;
  readonly secret: string;
  readonly now: string;
  readonly toleranceSeconds?: number;
}): boolean {
  const eventSeconds = Number(input.timestamp);
  const ageSeconds = Math.abs(Date.parse(input.now) / 1000 - eventSeconds);
  if (!Number.isFinite(eventSeconds) || ageSeconds > (input.toleranceSeconds ?? 300)) return false;
  const expected = Buffer.from(signEmailWebhook(input.body, input.id, input.timestamp, input.secret));
  const candidates = input.signature.split(" ").flatMap((item) => {
    const [version, value] = item.split(",", 2);
    return version === "v1" && value ? [Buffer.from(value)] : [];
  });
  return candidates.some((candidate) =>
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

export function parseEmailProviderEvent(body: string): EmailProviderEvent {
  const value = JSON.parse(body) as Partial<EmailProviderEvent>;
  if (!value.type || !value.created_at || !value.data?.email_id) {
    throw new Error("EMAIL_WEBHOOK_PAYLOAD_INVALID");
  }
  return value as EmailProviderEvent;
}

export function transportStatusForProviderEvent(type: string):
  | "DELIVERED"
  | "BOUNCED"
  | "COMPLAINED"
  | "SUPPRESSED"
  | undefined {
  const statuses: Readonly<Record<string, "DELIVERED" | "BOUNCED" | "COMPLAINED" | "SUPPRESSED">> = {
    "email.delivered": "DELIVERED",
    "email.bounced": "BOUNCED",
    "email.complained": "COMPLAINED",
    "email.suppressed": "SUPPRESSED"
  };
  return statuses[type];
}
