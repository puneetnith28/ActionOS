import { describe, expect, it } from "vitest";
import { examplePromises } from "../lib/example-promises";

describe("current example promises", () => {
  it("derives overdue dates from an injected UTC clock instead of release-day constants", () => {
    const examples = examplePromises(new Date("2026-09-10T23:59:00.000Z"));
    expect(examples[0].text).toContain("September 9, 2026");
    expect(examples[1].text).toContain("September 8, 2026");
    expect(JSON.stringify(examples)).not.toMatch(/August 2[0-5], 2026/);
  });
});
