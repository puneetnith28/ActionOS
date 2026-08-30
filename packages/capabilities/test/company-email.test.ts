import { describe, expect, it, vi } from "vitest";
import { CompanyEmailActionAdapter } from "../src/company-email";

const proposal = {
  ownerId: "person_12345678",
  planVersion: 1,
  planHash: `sha256:${"a".repeat(64)}`,
  actionType: "SEND_FOLLOW_UP",
  recipient: "support@example.com",
  sharedFields: { transactionRef: "ORDER-79", amountMinor: "7900", currency: "USD" }
};

describe("company email action adapter", () => {
  it("sends an idempotent, replyable plain-text follow-up", async () => {
    const request = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      void input;
      void init;
      return Promise.resolve(new Response(JSON.stringify({ id: "email_12345678" }), { status: 200 }));
    });
    const adapter = new CompanyEmailActionAdapter({
      apiKey: "test-key",
      from: "DueBack <followup@example.com>",
      replyDomain: "inbound.example.com",
      request
    });
    await expect(adapter.execute(proposal, "action/case-79/1", { missionId: "mission_12345678" }))
      .resolves.toMatchObject({ receiptId: "email_12345678" });
    expect(request).toHaveBeenCalledOnce();
    const [, init] = request.mock.calls[0] ?? [];
    expect(init?.headers).toMatchObject({ "idempotency-key": "action/case-79/1" });
    expect(typeof init?.body).toBe("string");
    const body = typeof init?.body === "string" ? JSON.parse(init.body) as unknown : {};
    expect(body).toMatchObject({
      to: ["support@example.com"],
      subject: "Follow-up for ORDER-79"
    });
    expect((body as { reply_to?: string }).reply_to).toMatch(/^case\+[a-f0-9]{32}@inbound\.example\.com$/);
  });

  it("rejects a non-email recipient before calling the provider", async () => {
    const request = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      void input;
      void init;
      return Promise.resolve(new Response(null, { status: 500 }));
    });
    const adapter = new CompanyEmailActionAdapter({ apiKey: "test-key", from: "a@example.com", replyDomain: "inbound.example.com", request });
    await expect(adapter.execute({ ...proposal, recipient: "not-an-email" }, "key", { missionId: "mission_12345678" }))
      .rejects.toThrow("COMPANY_EMAIL_RECIPIENT_INVALID");
    expect(request).not.toHaveBeenCalled();
  });

  it.each([429, 500, 503])("reports provider HTTP %s without a false receipt", async (status) => {
    const adapter = new CompanyEmailActionAdapter({
      apiKey: "test-key",
      from: "a@example.com",
      replyDomain: "inbound.example.com",
      request: () => Promise.resolve(new Response(null, { status }))
    });
    await expect(adapter.execute(proposal, "key", { missionId: "mission_12345678" }))
      .rejects.toThrow(`COMPANY_EMAIL_TRANSPORT_${String(status)}`);
  });

  it("marks network and missing-receipt outcomes as uncertain", async () => {
    const networkFailure = new CompanyEmailActionAdapter({
      apiKey: "test-key", from: "a@example.com", replyDomain: "inbound.example.com",
      request: () => Promise.reject(new Error("socket closed"))
    });
    await expect(networkFailure.execute(proposal, "key", { missionId: "mission_12345678" }))
      .rejects.toMatchObject({ name: "CapabilityOutcomeUnknownError" });
    const missingReceipt = new CompanyEmailActionAdapter({
      apiKey: "test-key", from: "a@example.com", replyDomain: "inbound.example.com",
      request: () => Promise.resolve(new Response("{}"))
    });
    await expect(missingReceipt.execute(proposal, "key", { missionId: "mission_12345678" }))
      .rejects.toMatchObject({ name: "CapabilityOutcomeUnknownError" });
  });
});
