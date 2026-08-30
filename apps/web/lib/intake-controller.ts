import { acceptUpload } from "@actionos/capabilities/upload";
import { stableHash } from "@actionos/domain";
import type { IntakeService } from "@actionos/runtime/intake-service";
import { redactedPublicError } from "./security-limits";

export interface IntakeControllerDependencies {
  readonly authenticate: (request: Request) => Promise<{ uid: string }>;
  readonly service: IntakeService;
  readonly now: () => string;
}

export async function handleIntake(
  request: Request,
  dependencies: IntakeControllerDependencies
): Promise<Response> {
  try {
    const owner = await dependencies.authenticate(request);
    const form = await request.formData();
    const text = form.get("text");
    const file = form.get("file");
    const receivedAt = dependencies.now();
    const contextText = typeof text === "string" ? text.trim() : "";
    const hasFile = file instanceof File && file.size > 0;
    const input = hasFile
          ? {
              declaredMediaType: file.type,
              bytes: new Uint8Array(await file.arrayBuffer()),
              receivedAt
            }
          : contextText
            ? { declaredMediaType: "text/plain", bytes: new TextEncoder().encode(contextText), receivedAt }
            : undefined;
    if (!input) return Response.json({ error: "PROMISE_SOURCE_REQUIRED" }, { status: 400 });
    const accepted = acceptUpload(input);
    const content =
      accepted.mediaType === "text/plain"
        ? new TextDecoder().decode(accepted.sanitizedBytes)
        : {
            dataUrl: `data:${accepted.mediaType};base64,${Buffer.from(accepted.sanitizedBytes).toString("base64")}`,
            contentType: accepted.mediaType,
            ...(contextText ? { contextText } : {})
          };
    const sourceIdentity = contextText && hasFile
      ? stableHash({ file: accepted.sha256, contextText })
      : accepted.sha256;
    const result = await dependencies.service.intake(
      {
        artifactId: contextText && hasFile ? `artifact_${sourceIdentity.slice(7, 31)}` : accepted.artifactId,
        ownerId: owner.uid,
        sourceChannel: hasFile ? "upload" : "paste",
        sha256: sourceIdentity,
        content
      },
      receivedAt
    );
    return Response.json(
      {
        missionId: result.draft.missionId,
        duplicate: result.duplicate,
        activationBlocked: result.draft.activationBlocked,
        blockingFields: result.draft.blockingFields
      },
      { status: result.duplicate ? 200 : 201 }
    );
  } catch (cause) {
    const error = redactedPublicError(cause);
    const diagnostic = cause instanceof Error && /^[A-Z0-9_:,-]{1,200}$/.test(cause.message)
      ? cause.message
      : cause instanceof Error
        ? cause.name
        : "UNKNOWN_ERROR";
    console.error("[intake] failed", { publicCode: error, diagnostic });
    const candidateStatus =
      "status" in Object(cause) ? (cause as { status?: unknown }).status : undefined;
    const status =
      typeof candidateStatus === "number" && candidateStatus >= 400 && candidateStatus <= 599
        ? candidateStatus
        : 422;
    return Response.json({ error }, { status });
  }
}
