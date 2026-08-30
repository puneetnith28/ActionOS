import { describe, expect, it, vi } from "vitest";
import type { AnalysisJob } from "@actionos/contracts";
import { handleAnalysisIntake } from "../lib/analysis-intake-controller";

function request(text = "Northstar promised a USD 59 refund by August 20, reference NS-42.") {
  const form = new FormData();
  form.set("text", text);
  return new Request("https://actionos.test/api/intake", { method: "POST", body: form });
}

describe("durable analysis intake", () => {
  it("persists the private artifact and returns a queued mission immediately", async () => {
    let savedPath = "";
    let created: AnalysisJob | undefined;
    const schedule = vi.fn();
    const response = await handleAnalysisIntake(request(), {
      authenticate: () => Promise.resolve({ uid: "owner_12345678" }),
      storage: {
        save: (input) => { savedPath = input.path; return Promise.resolve(); }
      },
      store: {
        createOrGet: (job) => { created = job; return Promise.resolve({ job, duplicate: false }); },
        markTerminalFailure: vi.fn()
      },
      consumeBudget: vi.fn(),
      schedule,
      now: () => "2026-08-18T12:00:00.000Z"
    });
    expect(response.status).toBe(202);
    expect(savedPath).toMatch(/^analysis\//);
    expect(created?.status).toBe("QUEUED");
    expect(schedule).toHaveBeenCalledWith(created?.jobId, "2026-08-18T12:00:00.000Z");
    expect(await response.json()).toMatchObject({ missionId: created?.missionId, status: "QUEUED" });
  });

  it("deduplicates the same promise without consuming another mission budget", async () => {
    const existing = {
      jobId: "analysis_existing123",
      missionId: "mission_existing123",
      ownerId: "owner_12345678",
      artifactId: "artifact_existing123",
      artifactPath: "analysis/owner/source",
      sourceChannel: "paste",
      mediaType: "text/plain",
      sha256: "sha256:" + "a".repeat(64),
      status: "ANALYZING",
      stage: "GEMINI_EXTRACTION",
      attemptCount: 1,
      createdAt: "2026-08-18T12:00:00.000Z",
      updatedAt: "2026-08-18T12:00:01.000Z"
    } satisfies AnalysisJob;
    const consumeBudget = vi.fn();
    const response = await handleAnalysisIntake(request(), {
      authenticate: () => Promise.resolve({ uid: existing.ownerId }),
      storage: { save: vi.fn() },
      store: {
        createOrGet: () => Promise.resolve({ job: existing, duplicate: true }),
        markTerminalFailure: vi.fn()
      },
      consumeBudget,
      schedule: vi.fn(),
      now: () => existing.createdAt
    });
    expect(response.status).toBe(200);
    expect(consumeBudget).not.toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ missionId: existing.missionId, duplicate: true });
  });
});
