import { describe, expect, it } from "vitest";
import { managedEmailProjectionFixture, sandboxProjectionFixture, weakAcknowledgementFixture } from "@dueback/test-fixtures/case-projections";
import { projectConsumerCase } from "../lib/case-projection";
import type { FollowThroughCase } from "@dueback/runtime/case-runner";
import type { EvidenceRecord } from "@dueback/runtime/evidence-service";

const managed = managedEmailProjectionFixture as unknown as FollowThroughCase;
const sandbox = sandboxProjectionFixture as unknown as FollowThroughCase;
const acknowledgement = weakAcknowledgementFixture as unknown as EvidenceRecord;

describe("consumer case projection", () => {
  it("uses managed-email copy without sandbox claims", () => {
    const detail = projectConsumerCase({ item: managed, evidence: [acknowledgement], channelEvents: [{ channelType: "MANAGED_EMAIL", transportStatus: "DELIVERED", acceptedAt: "2026-08-17T10:00:00.000Z" }] });
    expect(detail.channel.label).toBe("Email");
    expect(JSON.stringify(detail)).not.toMatch(/merchant sandbox|signed callback/i);
    expect(detail.nextAction).toMatch(/Not done/i);
  });

  it("keeps the controlled demo disclosure and strips private internals", () => {
    const detail = projectConsumerCase({ item: sandbox, evidence: [] });
    expect(detail.channel.label).toBe("Controlled demo");
    const serialized = JSON.stringify(detail);
    expect(serialized).not.toContain("Private approved message body");
    expect(serialized).not.toContain(sandbox.ownerId);
    expect(serialized).not.toContain(sandbox.plan.planHash);
  });

  it("never fills missing reply facts from the promise", () => {
    const detail = projectConsumerCase({
      item: {
        ...managed,
        nextWakeAt: "2026-08-19T10:00:00.000Z",
        plan: { ...managed.plan, counterpartyName: "Northstar Store" }
      },
      evidence: [acknowledgement]
    });
    expect(detail.counterpartyName).toBe("Northstar Store");
    expect(detail.nextAction).toMatch(/Another approved follow-up is scheduled/i);
    expect(detail.conversation.at(-1)?.safeBody).toBe("Reference R-59");
    expect(detail.comparison.find((row) => row.label === "Amount")).toMatchObject({ observed: "Not stated in the reply", status: "MISSING" });
  });
});
