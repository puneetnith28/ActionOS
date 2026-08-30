import { describe, expect, it } from "vitest";
import type { FollowThroughCase } from "@dueback/runtime/case-runner";
import { caseSummary, handleCases, type CaseSummary } from "../lib/cases-controller";

function item(state: FollowThroughCase["state"], ownerId = "owner_12345678") {
  return {
    caseId: `case_${state.toLowerCase()}_12345678`, ownerId, state, dueAt: "2026-08-17T12:00:00.000Z",
    plan: { counterpartyName: "Northstar Store", allowedRecipient: "support@example.com", channelType: "MANAGED_EMAIL",
      evidenceRequirements: [{ subject: "USD 59 refund", transactionRef: "R-59" }] }
  } as unknown as FollowThroughCase;
}

function datedItem(state: FollowThroughCase["state"], date: string, suffix: string) {
  return {
    ...item(state),
    caseId: `case_${suffix}_12345678`,
    dueAt: date
  } as FollowThroughCase;
}

describe("owner case inbox", () => {
  it("maps lifecycle states to three human buckets", () => {
    expect(caseSummary(item("NEEDS_ATTENTION"))).toMatchObject({ bucket: "NEEDS_YOU", attentionRequired: true });
    expect(caseSummary(item("WAITING_EXTERNAL"))).toMatchObject({ bucket: "WORKING", statusLabel: "Waiting for the company" });
    expect(caseSummary(item("DONE"))).toMatchObject({ bucket: "DONE", nextStepLabel: "Review the proof and limitation" });
    expect(caseSummary(item("WAITING_EXTERNAL"))).toMatchObject({ companyName: "Northstar Store" });
  });

  it("uses persisted counterparty and newest activity instead of recipient provider or due date", () => {
    const value = {
      ...item("WAITING_EXTERNAL"),
      dueAt: "2026-08-20T00:00:00.000Z",
      lastAttemptAt: "2026-08-18T10:00:00.000Z",
      updatedAt: "2026-08-18T10:05:00.000Z"
    };
    expect(caseSummary(value)).toMatchObject({
      companyName: "Northstar Store",
      lastActivityAt: "2026-08-18T10:05:00.000Z"
    });
  });

  it("queries only the authenticated owner and bounds the response", async () => {
    let queriedOwner = "";
    const response = await handleCases(new Request("https://dueback.test/api/cases?limit=1"), {
      authenticate: () => Promise.resolve({ uid: "owner_12345678" }),
      store: { listByOwner: (ownerId) => { queriedOwner = ownerId; return Promise.resolve([item("DONE"), item("NEEDS_ATTENTION")]); } }
    });
    expect(queriedOwner).toBe("owner_12345678");
    await expect(response.json()).resolves.toMatchObject({ items: [{ caseId: "case_done_12345678" }] });
  });

  it("keeps an unfinished Gemini analysis visible after the tab is closed", async () => {
    const response = await handleCases(new Request("https://dueback.test/api/cases"), {
      authenticate: () => Promise.resolve({ uid: "owner_12345678" }),
      store: { listByOwner: () => Promise.resolve([]) },
      analysisStore: { listByOwner: () => Promise.resolve([{
        jobId: "analysis_visible123",
        caseId: "case_visible123",
        ownerId: "owner_12345678",
        artifactId: "artifact_visible123",
        artifactPath: "analysis/owner/source",
        sourceChannel: "upload",
        mediaType: "image/png",
        sha256: "sha256:" + "c".repeat(64),
        status: "ANALYZING",
        stage: "GEMINI_EXTRACTION",
        attemptCount: 1,
        createdAt: "2026-08-18T12:00:00.000Z",
        updatedAt: "2026-08-18T12:00:01.000Z"
      }]) }
    });
    await expect(response.json()).resolves.toMatchObject({ items: [{
      caseId: "case_visible123",
      statusLabel: "Gemini is building the plan",
      detailPath: "/cases/case_visible123/analyzing"
    }] });
  });

  it("returns a stable opaque cursor and continues without duplicates", async () => {
    const records = [
      datedItem("DONE", "2026-08-19T12:00:00.000Z", "newest"),
      datedItem("DONE", "2026-08-18T12:00:00.000Z", "middle"),
      datedItem("DONE", "2026-08-17T12:00:00.000Z", "oldest")
    ];
    const dependencies = {
      authenticate: () => Promise.resolve({ uid: "owner_12345678" }),
      store: { listByOwner: () => Promise.resolve(records) }
    };
    const first = await handleCases(new Request("https://dueback.test/api/cases?limit=2&bucket=DONE"), dependencies);
    const firstBody = await first.json() as { items: CaseSummary[]; nextCursor: string };
    expect(firstBody.items.map(({ caseId }) => caseId)).toEqual(["case_newest_12345678", "case_middle_12345678"]);
    expect(firstBody.nextCursor).toBeTruthy();

    const second = await handleCases(new Request(`https://dueback.test/api/cases?limit=2&bucket=DONE&cursor=${encodeURIComponent(firstBody.nextCursor)}`), dependencies);
    await expect(second.json()).resolves.toMatchObject({ items: [{ caseId: "case_oldest_12345678" }], nextCursor: null });
  });

  it("rejects malformed, unknown and cross-filter cursors", async () => {
    const records = [datedItem("DONE", "2026-08-19T12:00:00.000Z", "newest"), datedItem("DONE", "2026-08-18T12:00:00.000Z", "middle")];
    const dependencies = {
      authenticate: () => Promise.resolve({ uid: "owner_12345678" }),
      store: { listByOwner: () => Promise.resolve(records) }
    };
    const malformed = await handleCases(new Request("https://dueback.test/api/cases?cursor=not-json"), dependencies);
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toEqual({ error: "CURSOR_INVALID" });

    const first = await handleCases(new Request("https://dueback.test/api/cases?limit=1&bucket=DONE"), dependencies);
    const { nextCursor } = await first.json() as { nextCursor: string };
    const changedFilter = await handleCases(new Request(`https://dueback.test/api/cases?bucket=WORKING&cursor=${encodeURIComponent(nextCursor)}`), dependencies);
    expect(changedFilter.status).toBe(400);
  });
});
