import { describe, expect, it } from "vitest";
import { acceptUpload, UploadPolicyError, uploadLimits, validateUploadBatch } from "../src/upload";

describe("upload policy", () => {
  it("accepts bounded UTF-8 text and assigns 24-hour retention", () => {
    const result = acceptUpload({
      declaredMediaType: "text/plain",
      bytes: new TextEncoder().encode("Merchant confirms a USD 79 refund."),
      receivedAt: "2026-08-15T12:00:00.000Z"
    });
    expect(result.mediaType).toBe("text/plain");
    expect(result.retentionUntil).toBe("2026-08-16T12:00:00.000Z");
  });

  it("detects media content instead of trusting the extension or declared MIME", () => {
    expect(() =>
      acceptUpload({
        declaredMediaType: "application/pdf",
        bytes: new TextEncoder().encode("<html>active content</html>"),
        receivedAt: "2026-08-15T12:00:00.000Z"
      })
    ).toThrow(
      new UploadPolicyError("Declared and detected media types differ", "MEDIA_TYPE_MISMATCH")
    );
  });

  it("rejects oversized files and batches", () => {
    expect(() =>
      acceptUpload({
        declaredMediaType: "text/plain",
        bytes: new Uint8Array(uploadLimits.maxBytes + 1),
        receivedAt: "2026-08-15T12:00:00.000Z"
      })
    ).toThrow(/10 MB/);
    expect(() => {
      validateUploadBatch(4);
    }).toThrow(/three artifacts/);
  });

  it("enforces the PDF page bound", () => {
    const pages = Array.from({ length: 21 }, () => "/Type /Page").join("\n");
    expect(() =>
      acceptUpload({
        declaredMediaType: "application/pdf",
        bytes: new TextEncoder().encode(`%PDF-1.7\n${pages}\n%%EOF`),
        receivedAt: "2026-08-15T12:00:00.000Z"
      })
    ).toThrow(/20 pages/);
  });
});
