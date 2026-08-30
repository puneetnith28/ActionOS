import type { CaseResultStore } from "./result-controller";
import { projectConsumerCase } from "./case-projection";

export async function handleCaseDetail(request: Request, caseId: string, dependencies: {
  authenticate: (request: Request) => Promise<{ uid: string }>;
  store: CaseResultStore;
}): Promise<Response> {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    const owner = await dependencies.authenticate(request);
    const item = await dependencies.store.get(caseId);
    if (!item || item.ownerId !== owner.uid) return Response.json({ error: "CASE_NOT_FOUND" }, { status: 404, headers });
    const [evidence, interventions, events, notifications, channelEvents] = await Promise.all([
      dependencies.store.listEvidence(caseId), dependencies.store.listInterventions?.(caseId) ?? [], dependencies.store.listEvents?.(caseId) ?? [],
      dependencies.store.listNotifications?.(caseId) ?? [], dependencies.store.listChannelEvents?.(caseId) ?? []
    ]);
    return Response.json(projectConsumerCase({ item, evidence, interventions, events, notifications, channelEvents }), { headers });
  } catch (error) {
    const code = error instanceof Error ? error.message : "DETAIL_FAILED";
    const auth = ["AUTHENTICATION_REQUIRED", "INVALID_ID_TOKEN"].includes(code);
    return Response.json({ error: auth ? code : "DETAIL_FAILED" }, { status: auth ? 401 : 500, headers });
  }
}
