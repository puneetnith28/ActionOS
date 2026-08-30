import { describe, expect, it, vi } from "vitest";
import { planExecutionWithGateway, type PlanningModelGateway } from "../src/plan-execution";

const validGoal = {
  goalType: "REFUND" as const,
  promisor: { value: "acme@example.com", provenance: [{ artifactId: "artifact-12345678", locator: "b", excerptHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000", confidence: "HIGH" as const }], uncertainty: "NONE" as const },
  result: { value: "Full refund for the order.", provenance: [{ artifactId: "artifact-12345678", locator: "b", excerptHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000", confidence: "HIGH" as const }], uncertainty: "NONE" as const },
  transactionRef: { value: "ORD-123", provenance: [{ artifactId: "artifact-12345678", locator: "b", excerptHash: "sha256:0000000000000000000000000000000000000000000000000000000000000000", confidence: "HIGH" as const }], uncertainty: "NONE" as const },
  proposedVerificationStatus: "OUTCOME_CONFIRMED" as const
};

describe("execution planning", () => {
  it("decomposes a valid goal into an execution plan", async () => {
    const expectedOutput = {
      allowedActions: ["SEND_FOLLOW_UP" as const],
      evidenceRequirements: [{ minimumStatus: "OUTCOME_CONFIRMED" as const, maxAgeSeconds: 86400 }],
      explanation: "Send follow up to request the refund."
    };
    
    const gateway: PlanningModelGateway = {
      generate: vi.fn().mockResolvedValue(expectedOutput)
    };
    
    const result = await planExecutionWithGateway(gateway, validGoal);
    expect(result).toEqual(expectedOutput);
    expect(gateway.generate).toHaveBeenCalledOnce();
  });
  
  it("throws when the model fails to generate an output", async () => {
    const gateway: PlanningModelGateway = {
      generate: vi.fn().mockResolvedValue(null)
    };
    
    await expect(planExecutionWithGateway(gateway, validGoal)).rejects.toThrow("MODEL_OUTPUT_MISSING");
  });
});
