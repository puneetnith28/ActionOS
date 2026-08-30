import { describe, expect, it, vi } from "vitest";
import { PartnerApiFixtureAdapter } from "../src/partner-api";

const proposal = {
  ownerId: "owner_12345678",
  planVersion: 1,
  planHash: `sha256:${"a".repeat(64)}`,
  actionType: "SEND_FOLLOW_UP" as const,
  channelType: "PARTNER_API",
  recipient: "partner_case_79",
  sharedFields: { transactionRef: "ORDER-79" }
};

describe("controlled partner API fixture", () => {
  it("sends the common envelope with idempotency and a body signature", async () => {
    const request = vi.fn((input: string | URL | Request, init?: RequestInit) => {
      void input;
      void init;
      return Promise.resolve(new Response(JSON.stringify({
        receiptId: "partner_receipt_1",
        acceptedAt: "2026-08-16T10:00:00.000Z"
      })));
    });
    const adapter = new PartnerApiFixtureAdapter({
      endpoint: "https://fixture.example/v1/dueback/actions",
      signingSecret: "fixture-secret",
      request
    });
    await expect(adapter.execute(proposal, "action/case/1", { missionId: "case_12345678" }))
      .resolves.toMatchObject({ channelType: "PARTNER_API", missionId: "case_12345678" });
    const [, init] = request.mock.calls[0] ?? [];
    const headers = init?.headers as Record<string, string> | undefined;
    expect(headers?.["idempotency-key"]).toBe("action/case/1");
    expect(headers?.["x-dueback-signature"]).toMatch(/^sha256=[a-f0-9]{64}$/);
  });

  it("rejects arbitrary paths and insecure remote endpoints", () => {
    expect(() => new PartnerApiFixtureAdapter({
      endpoint: "https://fixture.example/arbitrary",
      signingSecret: "secret"
    })).toThrow("PARTNER_ENDPOINT_NOT_ALLOWED");
    expect(() => new PartnerApiFixtureAdapter({
      endpoint: "http://fixture.example/v1/dueback/actions",
      signingSecret: "secret"
    })).toThrow("PARTNER_ENDPOINT_NOT_ALLOWED");
  });
});
