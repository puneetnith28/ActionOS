import { createHmac, timingSafeEqual } from "node:crypto";

export interface SignedCallbackHeaders {
  readonly timestamp: string;
  readonly signature: string;
}

export function signCallback(body: string, timestamp: string, secret: string): string {
  return `v1=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

export function verifyCallbackSignature(
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean {
  const expected = signCallback(body, timestamp, secret);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export class CallbackReplayGuard {
  private readonly seen = new Set<string>();

  verify(input: {
    readonly body: string;
    readonly timestamp: string;
    readonly signature: string;
    readonly secret: string;
    readonly now: string;
    readonly maxAgeSeconds?: number;
  }): { valid: boolean; reason?: "INVALID_SIGNATURE" | "STALE_CALLBACK" | "REPLAYED_CALLBACK" } {
    const age = Math.abs(Date.parse(input.now) - Date.parse(input.timestamp)) / 1000;
    if (!Number.isFinite(age) || age > (input.maxAgeSeconds ?? 300)) {
      return { valid: false, reason: "STALE_CALLBACK" };
    }
    if (!verifyCallbackSignature(input.body, input.timestamp, input.signature, input.secret)) {
      return { valid: false, reason: "INVALID_SIGNATURE" };
    }
    const replayKey = `${input.timestamp}:${input.signature}`;
    if (this.seen.has(replayKey)) return { valid: false, reason: "REPLAYED_CALLBACK" };
    this.seen.add(replayKey);
    return { valid: true };
  }
}
