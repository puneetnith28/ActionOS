import { describe, expect, it, vi } from "vitest";
import { selectActionWithGateway, type ActionSelectionGateway } from "../src/select-action";

const validPlan = {
  planId: "plan-12345678",
  missionId: "mission-12345678",
  ownerId: "owner-12345678",
  version: 1,
  planHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
  goal: "Full refund for the order.",
  goalType: "REFUND" as const,
  allowedActions: ["SEND_FOLLOW_UP" as const],
  allowedRecipient: "acme@example.com",
  sharedFields: [],
  evidenceRequirements: [{
    minimumStatus: "OUTCOME_CONFIRMED" as const,
    amountMinor: 1000,
    currency: "USD",
    transactionRef: "ORD-123",
    maxAgeSeconds: 86400,
    trustedIssuer: "ACME"
  }],
  expiresAt: "2026-12-31T23:59:59.000Z"
};

const availableCapabilities = [
  {
    channelType: "MANAGED_EMAIL" as const,
    status: "AVAILABLE" as const,
    canSend: true,
    canReceive: true,
    supportsThreading: true,
    supportsDeliveryReceipt: true,
    supportsAuthenticatedReply: false,
    requiresUserOAuth: false,
    reasonCodes: [],
    checkedAt: "2026-08-30T10:00:00.000Z"
  }
];

describe("action selection", () => {
  it("selects a valid action based on capabilities", async () => {
    const expectedOutput = {
      actionType: "SEND_FOLLOW_UP" as const,
      channelType: "MANAGED_EMAIL" as const,
      reasoning: "Sending follow up via available managed email channel."
    };
    
    const gateway: ActionSelectionGateway = {
      generate: vi.fn().mockResolvedValue(expectedOutput)
    };
    
    const result = await selectActionWithGateway(gateway, { plan: validPlan, availableCapabilities });
    expect(result).toEqual(expectedOutput);
    expect(gateway.generate).toHaveBeenCalledOnce();
  });
  
  it("throws when missing channel type for active action", async () => {
    const gateway: ActionSelectionGateway = {
      generate: vi.fn().mockResolvedValue({
        actionType: "SEND_FOLLOW_UP",
        reasoning: "Missing channel"
      })
    };
    
    await expect(selectActionWithGateway(gateway, { plan: validPlan, availableCapabilities })).rejects.toThrow("CHANNEL_TYPE_REQUIRED_FOR_ACTION");
  });

  it("throws when selecting unavailable channel", async () => {
    const gateway: ActionSelectionGateway = {
      generate: vi.fn().mockResolvedValue({
        actionType: "SEND_FOLLOW_UP",
        channelType: "CONTROLLED_SANDBOX",
        reasoning: "Sandbox is not in capabilities list"
      })
    };
    
    await expect(selectActionWithGateway(gateway, { plan: validPlan, availableCapabilities })).rejects.toThrow("SELECTED_CHANNEL_UNAVAILABLE");
  });

  it("throws when the model fails to generate an output", async () => {
    const gateway: ActionSelectionGateway = {
      generate: vi.fn().mockResolvedValue(null)
    };
    
    await expect(selectActionWithGateway(gateway, { plan: validPlan, availableCapabilities })).rejects.toThrow("MODEL_OUTPUT_MISSING");
  });
});
