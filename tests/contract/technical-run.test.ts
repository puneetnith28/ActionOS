import { describe, expect, it } from "vitest";
import { technicalRunProjection } from "../../packages/runtime/src/technical-run";

describe("technical run projection", () => {
  it("uses only allowlisted persisted fields and labels missing telemetry", () => {
    const steps = technicalRunProjection({
      hasTypedDraft: true,
      events: [{
        eventId: "event_12345678", missionId: "mission_12345678", sequence: 1,
        type: "PLAN_APPROVED", actor: "PERSON", occurredAt: "2026-08-17T19:00:00.000Z",
        reasonCodes: ["CURRENT_PLAN_VERSION_APPROVED"], correlationId: "corr_private_abcdef123456",
        state: "READY"
      }],
      evidence: [], notifications: [], channelEvents: []
    });
    expect(steps[0]).toMatchObject({ stage: "GEMINI", status: "MISSING", reasonCodes: ["MODEL_TELEMETRY_MISSING"] });
    const serialized = JSON.stringify(steps);
    expect(serialized).not.toContain("corr_private");
    expect(serialized).not.toContain("@example.com");
    expect(serialized).not.toContain("messageBody");
    expect(serialized).not.toContain("providerMessageId");
  });

  it("shows rejected and accepted deterministic evidence decisions", () => {
    const base = {
      candidate: { missionId: "mission_12345678", issuedAt: "2026-08-17T19:00:00.000Z" },
      recordedAt: "2026-08-17T19:00:01.000Z", correlationId: "corr_abcdef123456"
    };
    const steps = technicalRunProjection({
      modelUsage: { lastStatus: "SUCCEEDED", lastObservedAt: "2026-08-17T18:59:00.000Z" },
      hasTypedDraft: true, events: [], notifications: [], channelEvents: [],
      evidence: [
        { ...base, candidate: { ...base.candidate, evidenceId: "evidence_rejected_1234" }, verification: { accepted: false, reasonCodes: ["INSUFFICIENT_LEVEL"] } },
        { ...base, candidate: { ...base.candidate, evidenceId: "evidence_accepted_1234" }, verification: { accepted: true, reasonCodes: ["ACCEPTED"] } }
      ] as never
    });
    expect(steps.filter((step) => step.stage === "VERIFIER").map((step) => step.status)).toEqual(["REJECTED", "SUCCEEDED"]);
  });
});
