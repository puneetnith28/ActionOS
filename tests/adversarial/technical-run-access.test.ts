import { describe, expect, it, vi } from "vitest";
import { handleTechnicalRun } from "../../apps/web/lib/technical-run-controller";
import { makeDraftMission } from "../helpers/draft-case";

describe("technical run access", () => {
  it("returns the same 404 to a non-owner without reading trace facts", async () => {
    const draft = makeDraftMission();
    const technicalRunSource = vi.fn();
    const response = await handleTechnicalRun(new Request("https://actionos.test/trace"), draft.caseId, {
      authenticate: () => Promise.resolve({ uid: "other_12345678" }),
      store: { get: () => Promise.resolve({ ...draft, state: "DONE", version: 3 } as never), technicalRunSource }
    });
    expect(response.status).toBe(404);
    expect(technicalRunSource).not.toHaveBeenCalled();
  });

  it("denies technical evidence for non-synthetic real-email cases", async () => {
    const draft = makeDraftMission();
    const technicalRunSource = vi.fn();
    const response = await handleTechnicalRun(new Request("https://actionos.test/trace"), draft.caseId, {
      authenticate: () => Promise.resolve({ uid: draft.ownerId }),
      store: {
        get: () => Promise.resolve({ ...draft, state: "DONE", version: 3, plan: { ...draft.plan, executionMode: "CONTROLLED_REAL_PILOT" } } as never),
        technicalRunSource
      }
    });
    expect(response.status).toBe(403);
    expect(technicalRunSource).not.toHaveBeenCalled();
  });
});
