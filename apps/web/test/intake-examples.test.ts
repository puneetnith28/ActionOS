import { describe, expect, it } from "vitest";
import { examplePromises } from "../lib/example-promises";

describe("current example promises", () => {
  it("provides representative mission examples", () => {
    const examples = examplePromises();
    expect(examples[0].text).toContain("Postgres database");
    expect(examples[1].text).toContain("legacy API");
  });
});
