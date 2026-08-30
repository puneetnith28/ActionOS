import type { FollowThroughCase } from "@dueback/runtime/case-runner";
import { technicalRunProjection, type TechnicalRunSource } from "@dueback/runtime/technical-run";

export interface TechnicalRunStore {
  get(caseId: string): Promise<FollowThroughCase | undefined>;
  technicalRunSource(caseId: string): Promise<TechnicalRunSource>;
}

export async function handleTechnicalRun(
  request: Request,
  caseId: string,
  dependencies: {
    authenticate: (request: Request) => Promise<{ uid: string }>;
    store: TechnicalRunStore;
  }
): Promise<Response> {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const owner = await dependencies.authenticate(request);
    const item = await dependencies.store.get(caseId);
    if (!item || item.ownerId !== owner.uid) return Response.json({ error: "CASE_NOT_FOUND" }, { status: 404, headers });
    if (item.plan.executionMode !== "ACCELERATED_DEMO")
      return Response.json({ error: "TECHNICAL_RUN_NOT_ELIGIBLE" }, { status: 403, headers });
    const source = await dependencies.store.technicalRunSource(caseId);
    return Response.json({ steps: technicalRunProjection(source) }, { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "TECHNICAL_RUN_FAILED";
    const auth = ["AUTHENTICATION_REQUIRED", "INVALID_ID_TOKEN"].includes(code);
    return Response.json({ error: auth ? code : "TECHNICAL_RUN_FAILED" }, { status: auth ? 401 : 500, headers });
  }
}
