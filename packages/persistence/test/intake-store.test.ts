import { describe, expect, it } from "vitest";
import { firstRunDueAt } from "../src/intake-store";
import type { DraftCase } from "@actionos/runtime/intake-service";

describe("first run scheduling", () => {
  it("uses the approved follow-up time instead of the company's later promise date", () => {
    const draft = {
      createdAt: "2026-08-17T12:00:00.000Z",
      plan: { followUpAt: "2026-08-17T12:00:02.000Z" },
      promiseDraft: { dueAt: { value: "2026-08-25T23:59:00.000Z" } }
    } as DraftCase;
    expect(firstRunDueAt(draft)).toBe("2026-08-17T12:00:02.000Z");
  });

  it("preserves the company date when no separate follow-up time exists", () => {
    const draft = {
      createdAt: "2026-08-17T12:00:00.000Z",
      plan: {},
      promiseDraft: { dueAt: { value: "2026-08-25T23:59:00.000Z" } }
    } as DraftCase;
    expect(firstRunDueAt(draft)).toBe("2026-08-25T23:59:00.000Z");
  });
});
