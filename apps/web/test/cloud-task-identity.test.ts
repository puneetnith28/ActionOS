import { describe, expect, it, vi } from "vitest";
import {
  assertExpectedCloudTaskClaims,
  requireCloudTaskIdentity
} from "../lib/cloud-task-identity";

describe("Cloud Tasks OIDC boundary", () => {
  it("rejects an unverified or different service account", () => {
    expect(() => assertExpectedCloudTaskClaims({
      email: "attacker@example.test",
      email_verified: true
    }, "actionos-tasks@example.test")).toThrow("CLOUD_TASK_IDENTITY_INVALID");
    expect(() => assertExpectedCloudTaskClaims({
      email: "actionos-tasks@example.test",
      email_verified: false
    }, "actionos-tasks@example.test")).toThrow("CLOUD_TASK_IDENTITY_INVALID");
  });

  it("accepts only the configured verified service account claim", () => {
    expect(assertExpectedCloudTaskClaims({
      email: "actionos-tasks@example.test",
      email_verified: true
    }, "actionos-tasks@example.test")).toBe("actionos-tasks@example.test");
  });

  it("fails closed when cryptographic verification fails", async () => {
    const response = await requireCloudTaskIdentity(
      new Request("https://actionos.test/internal", {
        headers: { "x-cloudtasks-taskname": "spoofed" }
      }),
      vi.fn().mockRejectedValue(new Error("invalid audience"))
    );
    expect(response?.status).toBe(401);
  });
});
