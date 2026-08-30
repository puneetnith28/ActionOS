import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import type { EvidenceRecord } from "@actionos/runtime/verification-service";
import type { InterventionRecord } from "@actionos/runtime/interventions";
import type { RuntimeTimelineEvent } from "@actionos/runtime/timeline";
import type { NotificationRecord } from "@actionos/runtime/notifications";

export interface CaseResultStore {
  get(missionId: string): Promise<FollowThroughMission | undefined>;
  listEvidence(missionId: string): Promise<readonly EvidenceRecord[]>;
  listInterventions?(missionId: string): Promise<readonly InterventionRecord[]>;
  listEvents?(missionId: string): Promise<readonly RuntimeTimelineEvent[]>;
  listNotifications?(missionId: string): Promise<readonly NotificationRecord[]>;
  listChannelEvents?(missionId: string): Promise<readonly {
    channelType: string;
    transportStatus: string;
    acceptedAt: string;
    observedAt?: string;
  }[]>;
}

export async function handleCaseResult(
  request: Request,
  missionId: string,
  dependencies: {
    authenticate: (request: Request) => Promise<{ uid: string }>;
    store: CaseResultStore;
  }
): Promise<Response> {
  const privateHeaders = { "Cache-Control": "private, no-store" };
  try {
    const owner = await dependencies.authenticate(request);
    const item = await dependencies.store.get(missionId);
    if (!item) return Response.json({ error: "MISSION_NOT_FOUND" }, { status: 404, headers: privateHeaders });
    if (item.ownerId !== owner.uid)
      return Response.json({ error: "MISSION_NOT_FOUND" }, { status: 404, headers: privateHeaders });
    const [evidence, interventions, events, notifications, channelEvents] = await Promise.all([
      dependencies.store.listEvidence(missionId),
      dependencies.store.listInterventions?.(missionId) ?? Promise.resolve([]),
      dependencies.store.listEvents?.(missionId) ?? Promise.resolve([]),
      dependencies.store.listNotifications?.(missionId) ?? Promise.resolve([]),
      dependencies.store.listChannelEvents?.(missionId) ?? Promise.resolve([])
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
