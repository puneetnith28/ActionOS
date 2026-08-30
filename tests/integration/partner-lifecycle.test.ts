import { describe, expect, it, vi } from "vitest";
import { PartnerApiFixtureAdapter } from "../../packages/capabilities/src/partner-api";
import {
  ExecutionBroker,
  type ExecutionReceipt,
  type Reservation
} from "../../packages/runtime/src/capability-broker";

describe("partner adapter lifecycle", () => {
  it("uses the common authorization, retry, idempotency and receipt lifecycle", async () => {
    let reservation: Reservation | undefined;
    const store = {
      reserve: () => Promise.resolve(reservation ?? { status: "RESERVED" as const }),
      succeed: (_key: string, receipt: ExecutionReceipt) => {
        reservation = { status: "SUCCEEDED", receipt };
        return Promise.resolve();
      },
      fail: () => { reservation = undefined; return Promise.resolve(); }
    };
    const request = vi.fn()
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        receiptId: "partner_receipt_123", acceptedAt: "2026-08-16T12:00:02.000Z"
      })));
    const broker = new ExecutionBroker(store, new PartnerApiFixtureAdapter({
      endpoint: "https://partner.example/v1/actionos/actions",
      signingSecret: "fixture-secret",
      request
    }));
    const input = {
      missionId: "mission_12345678", actionOrdinal: 1,
      policy: {
        ownerId: "owner_12345678", planVersion: 1, planHash: "sha256:plan",
        allowedActions: ["SEND_FOLLOW_UP" as const], allowedRecipient: "partner.example",
        allowedChannel: "PARTNER_API", sharedFields: ["transactionRef"],
        approval: { ownerId: "owner_12345678", planVersion: 1, planHash: "sha256:plan",
          expiresAt: "2027-01-01T00:00:00.000Z" }
      },
      proposal: {
        ownerId: "owner_12345678", planVersion: 1, planHash: "sha256:plan",
        actionType: "SEND_FOLLOW_UP" as const, channelType: "PARTNER_API",
        recipient: "partner.example", sharedFields: { transactionRef: "ORDER-79" }
      },
      now: "2026-08-16T12:00:00.000Z", correlationId: "corr_12345678"
    };
    await expect(broker.execute(input)).rejects.toThrow("PARTNER_API_503");
    await expect(broker.execute(input)).resolves.toMatchObject({
      status: "SUCCEEDED",
      receipt: { missionId: "mission_12345678", channelType: "PARTNER_API",
        correlationId: "corr_12345678" }
    });
    await expect(broker.execute(input)).resolves.toMatchObject({
      status: "SUCCEEDED", duplicate: true
    });
    expect(request).toHaveBeenCalledTimes(2);
    expect(request.mock.calls[0]?.[1]?.headers).toMatchObject({
      "idempotency-key": expect.any(String), "x-actionos-signature": expect.stringMatching(/^sha256=/)
    });
    expect(request.mock.calls[1]?.[1]?.headers).toMatchObject({
      "idempotency-key": request.mock.calls[0]?.[1]?.headers["idempotency-key"]
    });
  });
});
