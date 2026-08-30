import { describe, expect, it, vi } from "vitest";
import { CaseControlService } from "../../packages/runtime/src/case-control";
import { handleCaseControl } from "../../apps/web/lib/control-controller";
import {
  issueArtifactGrant,
  verifyArtifactGrant
} from "../../packages/capabilities/src/artifact-access";

describe("case control isolation", () => {
  it("rejects cross-owner control before any mutation", async () => {
    const transition = vi.fn();
    const deletion = vi.fn();
    const service = new CaseControlService({
      get: vi.fn(() =>
        Promise.resolve({
          caseId: "case_victim_1234",
          ownerId: "person_victim",
          state: "WAITING_EXTERNAL",
          version: 2,
          plan: {} as never,
          approval: {} as never,
          actionOrdinal: 1,
          dueAt: "2026-08-15T12:00:00.000Z"
        })
      ),
      transition,
      requestDeletion: deletion
    });
    const response = await handleCaseControl(
      new Request("https://dueback.test/api/cases/case_victim_1234/control", {
        method: "POST",
        body: JSON.stringify({ action: "DELETE", expectedVersion: 2, idempotencyKey: "isolation-command-1234" })
      }),
      "case_victim_1234",
      {
        authenticate: vi.fn(() => Promise.resolve({ uid: "person_attacker" })),
        service,
        now: () => "2026-08-15T12:00:00.000Z"
      }
    );
    expect(response.status).toBe(403);
    expect(transition).not.toHaveBeenCalled();
    expect(deletion).not.toHaveBeenCalled();
  });

  it("does not accept late evidence after a case was stopped", async () => {
    const { EvidenceService } = await import("../../packages/runtime/src/evidence-service");
    const service = new EvidenceService(
      {
        get: vi.fn(() =>
          Promise.resolve({
            caseId: "case_stopped_1234",
            ownerId: "person_owner",
            state: "CANCELLED" as const,
            version: 4,
            plan: {} as never
          })
        ),
        record: vi.fn()
      },
      { createIfAbsent: vi.fn() }
    );
    await expect(
      service.reconcile({ caseId: "case_stopped_1234" } as never, "2026-08-15T12:00:00.000Z")
    ).rejects.toThrow("EVIDENCE_NOT_ACCEPTED_IN_STATE");
  });

  it("rejects artifact-link reuse across owner, case, artifact, expiry, and tampering", () => {
    const secret = "artifact-access-test-secret";
    const token = issueArtifactGrant(
      {
        ownerId: "person_owner",
        caseId: "case_owner_1234",
        artifactId: "artifact_owner_1234",
        now: "2026-08-15T12:00:00.000Z"
      },
      secret
    );
    expect(() =>
      verifyArtifactGrant({
        token,
        secret,
        ownerId: "person_attacker",
        caseId: "case_owner_1234",
        artifactId: "artifact_owner_1234",
        now: "2026-08-15T12:01:00.000Z"
      })
    ).toThrow("ARTIFACT_GRANT_SCOPE_MISMATCH");
    expect(() =>
      verifyArtifactGrant({
        token,
        secret,
        ownerId: "person_owner",
        caseId: "case_other_1234",
        artifactId: "artifact_owner_1234",
        now: "2026-08-15T12:01:00.000Z"
      })
    ).toThrow("ARTIFACT_GRANT_SCOPE_MISMATCH");
    expect(() =>
      verifyArtifactGrant({
        token,
        secret,
        ownerId: "person_owner",
        caseId: "case_owner_1234",
        artifactId: "artifact_owner_1234",
        now: "2026-08-15T12:10:00.000Z"
      })
    ).toThrow("ARTIFACT_GRANT_EXPIRED");
    expect(() =>
      verifyArtifactGrant({
        token: `${token.slice(0, -1)}x`,
        secret,
        ownerId: "person_owner",
        caseId: "case_owner_1234",
        artifactId: "artifact_owner_1234",
        now: "2026-08-15T12:01:00.000Z"
      })
    ).toThrow("ARTIFACT_GRANT_INVALID");
  });
});
