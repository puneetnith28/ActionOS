import { stableHash } from "@actionos/domain";

export interface NormalizedInboundEmail {
  readonly providerEmailId: string;
  readonly from: string;
  readonly to: readonly string[];
  readonly subject: string;
  readonly text: string;
  readonly messageId?: string;
  readonly inReplyTo?: string;
  readonly contentHash: string;
  readonly attachments: readonly { id: string; filename: string; contentType: string; size: number }[];
}

export class ResendInboundEmailAdapter {
  constructor(
    private readonly apiKey: string,
    private readonly request: typeof fetch = fetch
  ) {}

  async retrieve(providerEmailId: string): Promise<NormalizedInboundEmail> {
    if (!/^[a-zA-Z0-9_-]{3,200}$/.test(providerEmailId)) throw new Error("INBOUND_EMAIL_ID_INVALID");
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      controller.abort();
    }, 10_000);
    try {
      const response = await this.request(
        `https://api.resend.com/emails/receiving/${encodeURIComponent(providerEmailId)}`,
        { headers: { authorization: `Bearer ${this.apiKey}` }, signal: controller.signal }
      );
      if (!response.ok) throw new Error(`INBOUND_EMAIL_TRANSPORT_${String(response.status)}`);
      const value = await response.json() as {
        from?: string;
        to?: string[];
        subject?: string;
        text?: string;
        headers?: Record<string, string>;
        attachments?: { id?: string; filename?: string; content_type?: string; size?: number }[];
      };
      if (!value.from || !value.to?.length) throw new Error("INBOUND_EMAIL_PAYLOAD_INVALID");
      const text = (value.text ?? "").slice(0, 100_000);
      const attachments = (value.attachments ?? []).slice(0, 3).map((item) => ({
        id: item.id ?? "unknown",
        filename: (item.filename ?? "attachment").slice(0, 200),
        contentType: (item.content_type ?? "application/octet-stream").slice(0, 100),
        size: Math.max(0, Math.min(item.size ?? 0, 10 * 1024 * 1024))
      }));
      return {
        providerEmailId,
        from: value.from.slice(0, 320),
        to: value.to.slice(0, 10).map((recipient) => recipient.slice(0, 320)),
        subject: (value.subject ?? "(no subject)").slice(0, 300),
        text,
        ...(value.headers?.["message-id"] ? { messageId: value.headers["message-id"].slice(0, 500) } : {}),
        ...(value.headers?.["in-reply-to"] ? { inReplyTo: value.headers["in-reply-to"].slice(0, 500) } : {}),
        contentHash: stableHash({ from: value.from, to: value.to, subject: value.subject, text }),
        attachments
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") throw new Error("INBOUND_EMAIL_TIMEOUT");
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }
}
