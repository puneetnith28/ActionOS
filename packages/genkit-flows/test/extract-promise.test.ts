import { describe, expect, it, vi } from "vitest";
import { hostilePromise, spanishRefundPromise } from "@actionos/test-fixtures";
import {
  buildExtractionPrompt,
  extractPromiseWithGateway,
  extractPromiseWithMetricsGateway,
  extractionSystemInstruction,
  verifiedSourceExcerpt,
  type PromiseModelGateway
} from "../src/extract-promise";

const hash = `sha256:${"a".repeat(64)}`;

function draft(artifactId: string) {
  const provenance = [
    { artifactId, locator: "text:0-120", excerptHash: hash, confidence: "HIGH" as const }
  ];
  return {
    promisor: { value: "Northstar Store", provenance, uncertainty: "NONE" as const },
    result: { value: "USD 79 refund", provenance, uncertainty: "NONE" as const },
    amountMinor: { value: 7900, provenance, uncertainty: "NONE" as const },
    currency: { value: "USD", provenance, uncertainty: "NONE" as const },
    transactionRef: { value: "ORDER-79", provenance, uncertainty: "NONE" as const },
    dueAt: {
      value: "2026-08-20T23:59:59.000Z",
      provenance,
      uncertainty: "NONE" as const
    },
    proposedVerificationStatus: "OUTCOME_CONFIRMED" as const
  };
}

describe("extractPromise", () => {
  it("returns a schema-valid Spanish promise with artifact-bound citations", async () => {
    const generate = vi.fn<PromiseModelGateway["generate"]>(() =>
      Promise.resolve(draft("artifact-spanish"))
    );
    const result = await extractPromiseWithGateway(
      { generate },
      {
        artifactId: "artifact-spanish",
        localeHint: "es",
        source: { kind: "text", content: spanishRefundPromise.content }
      }
    );
    expect(result.amountMinor?.value).toBe(7900);
    expect(result.currency?.value).toBe("USD");
    expect(result.transactionRef.value).toBe("ORDER-79");
  });

  it("retains provider token usage for budget and cost evidence", async () => {
    const generate = vi.fn<PromiseModelGateway["generate"]>(() =>
      Promise.resolve({
        draft: draft("artifact-metrics"),
        usage: { inputTokens: 120, outputTokens: 40, totalTokens: 160 }
      })
    );
    await expect(
      extractPromiseWithMetricsGateway(
        { generate },
        {
          artifactId: "artifact-metrics",
          source: { kind: "text", content: "A valid promise" }
        }
      )
    ).resolves.toMatchObject({
      usage: { inputTokens: 120, outputTokens: 40, totalTokens: 160 }
    });
  });

  it("quotes hostile content as data and gives the model no tool surface", () => {
    const prompt = buildExtractionPrompt({
      artifactId: "artifact-hostile",
      source: { kind: "text", content: hostilePromise.content }
    });
    expect(extractionSystemInstruction).toContain("Never infer or output permissions");
    const sourcePart = prompt[1];
    expect(sourcePart && "text" in sourcePart ? sourcePart.text : "").toContain(
      "<untrusted-source>"
    );
    expect(prompt).not.toHaveProperty("tools");
  });

  it("retains only exact bounded excerpts from the source", () => {
    const source = "The approved amount is USD 59.";
    expect(verifiedSourceExcerpt(source, "approved amount is USD 59")).toBe(
      "approved amount is USD 59"
    );
    expect(verifiedSourceExcerpt(source, "approved amount is USD 79")).toBeUndefined();
    expect(verifiedSourceExcerpt(undefined, "USD 59")).toBeUndefined();
  });

  it("rejects citations pointing to a different artifact", async () => {
    const generate = vi.fn<PromiseModelGateway["generate"]>(() =>
      Promise.resolve(draft("artifact-attacker"))
    );
    await expect(
      extractPromiseWithGateway(
        { generate },
        {
          artifactId: "artifact-original",
          source: { kind: "text", content: "A valid promise" }
        }
      )
    ).rejects.toThrow("MODEL_PROVENANCE_MISMATCH");
  });

  it("rejects null and free-form model output", async () => {
    const generate = vi.fn<PromiseModelGateway["generate"]>(() => Promise.resolve(null));
    await expect(
      extractPromiseWithGateway(
        { generate },
        { artifactId: "artifact-missing", source: { kind: "text", content: "promise" } }
      )
    ).rejects.toThrow("MODEL_OUTPUT_MISSING");
  });

  it("validates media data URLs outside the model-facing JSON Schema", async () => {
    const generate = vi.fn<PromiseModelGateway["generate"]>();
    await expect(
      extractPromiseWithGateway(
        { generate },
        {
          artifactId: "artifact-media",
          source: { kind: "media", dataUrl: "https://attacker.test/file", contentType: "image/png" }
        }
      )
    ).rejects.toThrow("MEDIA_DATA_URL_REQUIRED");
    expect(generate).not.toHaveBeenCalled();
  });
});
