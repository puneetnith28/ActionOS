import { describe, expect, it } from "vitest";
import { caseExportText } from "../../apps/web/lib/case-export";
import { handleCaseExport } from "../../apps/web/lib/export-controller";
import { makeDraftMission } from "../helpers/draft-mission";

describe("safe case export", () => {
  it("contains the decision and limitation without access capabilities or raw identifiers", () => {
    const draft = makeDraftMission();
    const item = {
      ...draft, state: "DONE", version: 3,
      plan: { ...draft.plan, allowedRecipient: "private@example.com", replyRoute: "case+secret@inbound.example.com", planHash: `sha256:${"a".repeat(64)}` }
    } as never;
    const text = caseExportText(item, [{
      candidate: {
        evidenceId: "evidence_private_1234", missionId: draft.missionId, level: "MERCHANT_CONFIRMED",
        amountMinor: 7900, currency: "USD", transactionRef: "ORDER-SECRET-79",
        issuedAt: "2026-08-17T19:00:00.000Z", issuer: "company", signatureValid: true
      },
      verification: { accepted: true, level: "MERCHANT_CONFIRMED", reasonCodes: ["ACCEPTED"] },
      recordedAt: "2026-08-17T19:00:01.000Z", correlationId: "corr_secret_1234"
    }], "2026-08-17T19:01:00.000Z");
    expect(text).toContain("The explicit evidence met the approved contract.");
    expect(text).toContain("not bank settlement");
    expect(text).toContain("••••T-79");
    for (const forbidden of [draft.missionId, draft.ownerId, "private@example.com", "case+secret", "sha256:", "corr_secret", "evidence_private"])
      expect(text).not.toContain(forbidden);
  });

  it("returns 404 without reading evidence for another owner", async () => {
    const draft = makeDraftMission();
    let evidenceRead = false;
    const response = await handleCaseExport(new Request("https://actionos.test/export"), draft.missionId, {
      authenticate: () => Promise.resolve({ uid: "other_12345678" }),
      store: {
        get: () => Promise.resolve({ ...draft, state: "DONE", version: 3 } as never),
        listEvidence: () => { evidenceRead = true; return Promise.resolve([]); }
      },
      now: () => "2026-08-17T19:01:00.000Z"
    });
    expect(response.status).toBe(404);
    expect(evidenceRead).toBe(false);
  });
});
