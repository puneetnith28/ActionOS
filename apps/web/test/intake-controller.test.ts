import { describe, expect, it, vi } from "vitest";
import { handleIntake } from "../lib/intake-controller";

describe("intake API contract", () => {
  it("requires a promise source", async () => {
    const response = await handleIntake(
      new Request("https://dueback.test/api/intake", { method: "POST", body: new FormData() }),
      {
        authenticate: () => Promise.resolve({ uid: "person_12345678" }),
        service: { intake: () => Promise.reject(new Error("must not run")) } as never,
        now: () => "2026-08-15T12:00:00.000Z"
      }
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "PROMISE_SOURCE_REQUIRED" });
  });

  it("analyzes an uploaded image together with optional user context", async () => {
    const intake = vi.fn((artifact: unknown, receivedAt: string) => {
      void artifact;
      void receivedAt;
      return Promise.resolve({
        draft: {
          caseId: "case_combined",
          activationBlocked: false,
          blockingFields: []
        },
        duplicate: false
      });
    });
    const form = new FormData();
    form.set("text", "The amount should be USD 59.");
    form.set(
      "file",
      new File(
        [new Uint8Array([
          0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
          0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52,
          0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0, 0, 0, 0, 0,
          0, 0, 0, 0, 0x49, 0x45, 0x4e, 0x44, 0, 0, 0, 0
        ])],
        "promise.png",
        { type: "image/png" }
      )
    );
    const response = await handleIntake(
      new Request("https://dueback.test/api/intake", { method: "POST", body: form }),
      {
        authenticate: () => Promise.resolve({ uid: "person_12345678" }),
        service: { intake } as never,
        now: () => "2026-08-15T12:00:00.000Z"
      }
    );
    expect(response.status).toBe(201);
    const call = intake.mock.calls[0];
    expect(call?.[0]).toMatchObject({
      sourceChannel: "upload",
      content: { contextText: "The amount should be USD 59." }
    });
    expect(call?.[1]).toBe("2026-08-15T12:00:00.000Z");
  });
});
