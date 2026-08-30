import { describe, expect, it, vi } from "vitest";
import { ResendInboundEmailAdapter } from "../src/inbound-email";

describe("inbound email adapter", () => {
  it("retrieves only from the exact provider endpoint and bounds content", async () => {
    const request = vi.fn((input: string | URL | Request) => {
      void input;
      return Promise.resolve(new Response(JSON.stringify({
      from: "Support <support@example.test>",
      to: ["case+route@inbound.example.test"],
      subject: "Re: refund",
      text: "x".repeat(100_100),
      headers: { "message-id": "<message-1>", "in-reply-to": "<outbound-1>" },
      attachments: Array.from({ length: 5 }, (_, index) => ({ id: `a${String(index)}`, filename: "proof.pdf", content_type: "application/pdf", size: 10 }))
    }), { status: 200 }));
    });
    const email = await new ResendInboundEmailAdapter("test-key", request).retrieve("email_123");
    const calledUrl = request.mock.calls[0]?.[0];
    expect(calledUrl).toBe("https://api.resend.com/emails/receiving/email_123");
    expect(email.text).toHaveLength(100_000);
    expect(email.attachments).toHaveLength(3);
  });

  it("rejects an unsafe provider identifier before fetching", async () => {
    const request = vi.fn();
    await expect(new ResendInboundEmailAdapter("test-key", request).retrieve("../../metadata"))
      .rejects.toThrow("INBOUND_EMAIL_ID_INVALID");
    expect(request).not.toHaveBeenCalled();
  });
});
