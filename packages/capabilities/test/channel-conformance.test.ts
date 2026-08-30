import { describe, expect, it, vi } from "vitest";
import type { ClosedActionAdapter } from "@actionos/runtime/action-broker";
import { CompanyEmailActionAdapter } from "../src/company-email";
import { MerchantSandboxAdapter } from "../src/merchant-sandbox";
import { PartnerApiFixtureAdapter } from "../src/partner-api";

const proposal = {
  ownerId: "owner_12345678",
  planVersion: 1,
  planHash: `sha256:${"a".repeat(64)}`,
  actionType: "SEND_FOLLOW_UP" as const,
  recipient: "support@example.test",
  sharedFields: { transactionRef: "ORDER-79" }
};

function cases(): readonly [string, ClosedActionAdapter][] {
  return [
    ["sandbox", new MerchantSandboxAdapter({
      baseUrl: "https://sandbox.example",
      scenario: "signed-completion",
      fetch: vi.fn(() => Promise.resolve(new Response(JSON.stringify({
        receiptId: "sandbox_receipt",
        acceptedAt: "2026-08-16T12:00:00.000Z"
      }))))
    })],
    ["managed email", new CompanyEmailActionAdapter({
      apiKey: "test", from: "dueback@example.test", replyDomain: "inbound.example.test",
      request: vi.fn(() => Promise.resolve(new Response(JSON.stringify({ id: "email_receipt" }))))
    })],
    ["partner fixture", new PartnerApiFixtureAdapter({
      endpoint: "https://partner.example/v1/dueback/actions",
      signingSecret: "test",
      request: vi.fn(() => Promise.resolve(new Response(JSON.stringify({
        receiptId: "partner_receipt",
        acceptedAt: "2026-08-16T12:00:00.000Z"
      }))))
    })]
  ];
}

describe("common channel adapter contract", () => {
  it.each(cases())("%s consumes one authorized proposal and returns a receipt", async (_name, adapter) => {
    const receipt = await adapter.execute(proposal, "action/case/1", {
      missionId: "case_12345678",
      correlationId: "corr_12345678"
    });
    expect(typeof receipt.receiptId).toBe("string");
    expect(receipt.receiptId.length).toBeGreaterThan(0);
    expect(Number.isFinite(Date.parse(receipt.acceptedAt))).toBe(true);
  });
});
