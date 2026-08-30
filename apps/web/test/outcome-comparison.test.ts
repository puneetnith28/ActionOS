import { describe, expect, it } from "vitest";
import type { FollowThroughMission } from "@actionos/runtime/case-runner";
import type { EvidenceRecord } from "@actionos/runtime/evidence-service";
import { outcomeComparison } from "../lib/outcome-comparison";

const item = { plan: { evidenceRequirements: [{ minimumStatus: "OUTCOME_CONFIRMED", transactionRef: "R-59", amountMinor: 5900, currency: "USD" }] } } as FollowThroughCase;

describe("promised versus observed", () => {
  it("keeps facts absent when the company did not state them", () => {
    const evidence = [{ candidate: { status: "ACTION_ATTEMPTED", transactionRef: "R-59" }, verification: { accepted: false } }] as EvidenceRecord[];
    expect(outcomeComparison(item, evidence)).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: "Amount", promised: "USD 59.00", observed: "Not stated in the reply", status: "MISSING" }),
      expect.objectContaining({ label: "Proof level", promised: "Company confirmed the outcome", observed: "Company acknowledged the request" }),
      expect.objectContaining({ label: "Currency", observed: "Not stated in the reply", status: "MISSING" })
    ]));
  });

  it("shows explicit matching proof without inferring settlement", () => {
    const evidence = [{ candidate: { status: "OUTCOME_CONFIRMED", transactionRef: "R-59", amountMinor: 5900, currency: "USD" }, verification: { accepted: true } }] as EvidenceRecord[];
    expect(outcomeComparison(item, evidence).every((row) => row.status === "MATCH")).toBe(true);
  });
});
