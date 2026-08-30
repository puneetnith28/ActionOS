import type { FollowThroughCase } from "@dueback/runtime/case-runner";
import type { EvidenceRecord } from "@dueback/runtime/evidence-service";
import type { InterventionRecord } from "@dueback/runtime/interventions";
import type { RuntimeTimelineEvent } from "@dueback/runtime/timeline";
import type { NotificationRecord } from "@dueback/runtime/notifications";

export interface CaseResultStore {
  get(caseId: string): Promise<FollowThroughCase | undefined>;
  listEvidence(caseId: string): Promise<readonly EvidenceRecord[]>;
  listInterventions?(caseId: string): Promise<readonly InterventionRecord[]>;
  listEvents?(caseId: string): Promise<readonly RuntimeTimelineEvent[]>;
  listNotifications?(caseId: string): Promise<readonly NotificationRecord[]>;
  listChannelEvents?(caseId: string): Promise<readonly {
    channelType: string;
    transportStatus: string;
    acceptedAt: string;
    observedAt?: string;
  }[]>;
}

export async function handleCaseResult(
  request: Request,
  caseId: string,
  dependencies: {
    authenticate: (request: Request) => Promise<{ uid: string }>;
    store: CaseResultStore;
  }
): Promise<Response> {
  const privateHeaders = { "Cache-Control": "private, no-store" };
  try {
    const owner = await dependencies.authenticate(request);
    const item = await dependencies.store.get(caseId);
    if (!item) return Response.json({ error: "CASE_NOT_FOUND" }, { status: 404, headers: privateHeaders });
    if (item.ownerId !== owner.uid)
      return Response.json({ error: "CASE_NOT_FOUND" }, { status: 404, headers: privateHeaders });
    const [evidence, interventions, events, notifications, channelEvents] = await Promise.all([
      dependencies.store.listEvidence(caseId),
      dependencies.store.listInterventions?.(caseId) ?? Promise.resolve([]),
      dependencies.store.listEvents?.(caseId) ?? Promise.resolve([]),
      dependencies.store.listNotifications?.(caseId) ?? Promise.resolve([]),
      dependencies.store.listChannelEvents?.(caseId) ?? Promise.resolve([])
    ]);
    return Response.json(
      { case: item, evidence, interventions, events, notifications, channelEvents },
      { headers: privateHeaders }
    );
  } catch (error) {
    const code = error instanceof Error ? error.message : "RESULT_FAILED";
    const authenticationError = ["AUTHENTICATION_REQUIRED", "INVALID_ID_TOKEN"].includes(code);
    return Response.json(
      { error: authenticationError ? code : "RESULT_FAILED" },
      { status: authenticationError ? 401 : 500, headers: privateHeaders }
    );
  }
}
