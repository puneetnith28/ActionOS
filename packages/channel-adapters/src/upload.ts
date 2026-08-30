import { createHash } from "node:crypto";

export const uploadLimits = Object.freeze({
  maxBytes: 10 * 1024 * 1024,
  maxPdfPages: 20,
  maxImagePixels: 20_000_000,
  maxTextCharacters: 50_000,
  maxArtifactsPerCase: 3
});

export type AcceptedMediaType = "application/pdf" | "image/jpeg" | "image/png" | "text/plain";

export interface UploadInput {
  readonly declaredMediaType: string;
  readonly bytes: Uint8Array;
  readonly receivedAt: string;
}

export interface AcceptedArtifact {
  readonly artifactId: string;
  readonly sha256: string;
  readonly mediaType: AcceptedMediaType;
  readonly sanitizedBytes: Uint8Array;
  readonly retentionUntil: string;
  readonly pageCount?: number;
  readonly width?: number;
  readonly height?: number;
}

export class UploadPolicyError extends Error {
  constructor(
    message: string,
    readonly code:
      | "EMPTY_FILE"
      | "FILE_TOO_LARGE"
      | "UNSUPPORTED_MEDIA_TYPE"
      | "MEDIA_TYPE_MISMATCH"
      | "PDF_PAGE_LIMIT"
      | "IMAGE_PIXEL_LIMIT"
      | "TEXT_CHARACTER_LIMIT"
      | "TOO_MANY_ARTIFACTS"
      | "MALFORMED_FILE"
  ) {
    super(message);
  }
}

function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean {
  return signature.every((value, index) => bytes[index] === value);
}

export function detectMediaType(bytes: Uint8Array): AcceptedMediaType | undefined {
  if (startsWith(bytes, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "application/pdf";
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!text.includes("\0")) return "text/plain";
  } catch {
    return undefined;
  }
  return undefined;
}

function pngDimensions(bytes: Uint8Array): { width: number; height: number } {
  if (bytes.length < 24) throw new UploadPolicyError("PNG header is truncated", "MALFORMED_FILE");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function jpegDimensions(bytes: Uint8Array): { width: number; height: number } {
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff)
      throw new UploadPolicyError("Malformed JPEG marker", "MALFORMED_FILE");
    const marker = bytes[offset + 1];
    if (marker === undefined) break;
    if (marker === 0xd9 || marker === 0xda) break;
    const length = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
    if (length < 2 || offset + 2 + length > bytes.length) {
      throw new UploadPolicyError("Malformed JPEG segment", "MALFORMED_FILE");
    }
    if (
      [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
        marker
      )
    ) {
      return {
        height: ((bytes[offset + 5] ?? 0) << 8) | (bytes[offset + 6] ?? 0),
        width: ((bytes[offset + 7] ?? 0) << 8) | (bytes[offset + 8] ?? 0)
      };
    }
    offset += 2 + length;
  }
  throw new UploadPolicyError("JPEG dimensions are missing", "MALFORMED_FILE");
}

function stripJpegMetadata(bytes: Uint8Array): Uint8Array {
  const chunks: Uint8Array[] = [bytes.slice(0, 2)];
  let offset = 2;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff || offset + 1 >= bytes.length) {
      chunks.push(bytes.slice(offset));
      break;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      chunks.push(bytes.slice(offset));
      break;
    }
    const length = ((bytes[offset + 2] ?? 0) << 8) | (bytes[offset + 3] ?? 0);
    const end = offset + 2 + length;
    if (length < 2 || end > bytes.length) {
      throw new UploadPolicyError("Malformed JPEG segment", "MALFORMED_FILE");
    }
    if (![0xe1, 0xed, 0xfe].includes(marker ?? -1)) chunks.push(bytes.slice(offset, end));
    offset = end;
  }
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const output = new Uint8Array(size);
  let cursor = 0;
  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  return output;
}

function stripPngMetadata(bytes: Uint8Array): Uint8Array {
  const chunks: Uint8Array[] = [bytes.slice(0, 8)];
  const removable = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);
  let offset = 8;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new UploadPolicyError("Malformed PNG chunk", "MALFORMED_FILE");
    const type = new TextDecoder().decode(bytes.slice(offset + 4, offset + 8));
    if (!removable.has(type)) chunks.push(bytes.slice(offset, end));
    offset = end;
    if (type === "IEND") break;
  }
  if (offset !== bytes.length)
    throw new UploadPolicyError("Malformed PNG ending", "MALFORMED_FILE");
  const size = chunks.reduce((total, chunk) => total + chunk.length, 0);
  const output = new Uint8Array(size);
  let cursor = 0;
  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.length;
  }
  return output;
}

export function validateUploadBatch(count: number): void {
  if (count > uploadLimits.maxArtifactsPerCase) {
    throw new UploadPolicyError("A case accepts at most three artifacts", "TOO_MANY_ARTIFACTS");
  }
}

export function acceptUpload(input: UploadInput): AcceptedArtifact {
  if (input.bytes.length === 0) throw new UploadPolicyError("File is empty", "EMPTY_FILE");
  if (input.bytes.length > uploadLimits.maxBytes) {
    throw new UploadPolicyError("File exceeds 10 MB", "FILE_TOO_LARGE");
  }
  const detected = detectMediaType(input.bytes);
  if (!detected) throw new UploadPolicyError("Unsupported file content", "UNSUPPORTED_MEDIA_TYPE");
  if (input.declaredMediaType !== detected) {
    throw new UploadPolicyError("Declared and detected media types differ", "MEDIA_TYPE_MISMATCH");
  }

  let sanitizedBytes = input.bytes;
  let pageCount: number | undefined;
  let width: number | undefined;
  let height: number | undefined;
  if (detected === "text/plain") {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
    if (Array.from(text).length > uploadLimits.maxTextCharacters) {
      throw new UploadPolicyError("Text exceeds 50,000 characters", "TEXT_CHARACTER_LIMIT");
    }
  } else if (detected === "application/pdf") {
    const content = new TextDecoder("latin1").decode(input.bytes);
    pageCount = content.match(/\/Type\s*\/Page\b/g)?.length ?? 0;
    if (pageCount === 0)
      throw new UploadPolicyError("PDF has no readable page objects", "MALFORMED_FILE");
    if (pageCount > uploadLimits.maxPdfPages) {
      throw new UploadPolicyError("PDF exceeds 20 pages", "PDF_PAGE_LIMIT");
    }
  } else {
    const dimensions =
      detected === "image/png" ? pngDimensions(input.bytes) : jpegDimensions(input.bytes);
    ({ width, height } = dimensions);
    if (width * height > uploadLimits.maxImagePixels) {
      throw new UploadPolicyError("Image exceeds 20 megapixels", "IMAGE_PIXEL_LIMIT");
    }
    sanitizedBytes =
      detected === "image/png" ? stripPngMetadata(input.bytes) : stripJpegMetadata(input.bytes);
  }

  const sha256 = createHash("sha256").update(sanitizedBytes).digest("hex");
  const retentionUntil = new Date(Date.parse(input.receivedAt) + 24 * 60 * 60 * 1000).toISOString();
  return {
    artifactId: `artifact_${sha256.slice(0, 24)}`,
    sha256,
    mediaType: detected,
    sanitizedBytes,
    retentionUntil,
    ...(pageCount === undefined ? {} : { pageCount }),
    ...(width === undefined ? {} : { width }),
    ...(height === undefined ? {} : { height })
  };
}
