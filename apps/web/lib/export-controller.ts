import type { FollowThroughCase } from "@dueback/runtime/case-runner";
import type { EvidenceRecord } from "@dueback/runtime/evidence-service";
import { caseExportText } from "./case-export";

export interface CaseExportStore {
  get(caseId: string): Promise<FollowThroughCase | undefined>;
  listEvidence(caseId: string): Promise<readonly EvidenceRecord[]>;
}

export async function handleCaseExport(
  request: Request,
  caseId: string,
  dependencies: {
    authenticate: (request: Request) => Promise<{ uid: string }>;
    store: CaseExportStore;
    now: () => string;
  }
): Promise<Response> {
  const headers = {
    "Cache-Control": "private, no-store",
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Disposition": "attachment; filename=dueback-case-summary.txt"
  };
  try {
    const owner = await dependencies.authenticate(request);
    const item = await dependencies.store.get(caseId);
    if (!item || item.ownerId !== owner.uid) return new Response("CASE_NOT_FOUND", { status: 404, headers });
    const evidence = await dependencies.store.listEvidence(caseId);
    return new Response(caseExportText(item, evidence, dependencies.now()), { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CASE_EXPORT_FAILED";
    const auth = ["AUTHENTICATION_REQUIRED", "INVALID_ID_TOKEN"].includes(code);
    return new Response(auth ? code : "CASE_EXPORT_FAILED", { status: auth ? 401 : 500, headers });
  }
}
