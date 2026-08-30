import type { ExecutionHistoryEntry } from "@actionos/contracts";

export interface ExecutionHistoryStore {
  appendHistory(entry: ExecutionHistoryEntry): Promise<void>;
  listForMission(missionId: string): Promise<ExecutionHistoryEntry[]>;
}

export class ExecutionHistoryService {
  constructor(private readonly store: ExecutionHistoryStore) {}

  async recordPlan(missionId: string, goal: string): Promise<void> {
    await this.store.appendHistory({
      historyId: `hist_${crypto.randomUUID().replace(/-/g, "")}`,
      missionId,
      occurredAt: new Date().toISOString(),
      eventType: "PLAN_CREATED",
      summary: `Created execution plan for goal: ${goal}`
    });
  }

  async recordAction(missionId: string, actionType: string, resultStatus: string): Promise<void> {
    await this.store.appendHistory({
      historyId: `hist_${crypto.randomUUID().replace(/-/g, "")}`,
      missionId,
      occurredAt: new Date().toISOString(),
      eventType: "ACTION_EXECUTED",
      summary: `Executed action ${actionType} with result ${resultStatus}`
    });
  }

  async recordEvidence(missionId: string, isAccepted: boolean, reason: string): Promise<void> {
    await this.store.appendHistory({
      historyId: `hist_${crypto.randomUUID().replace(/-/g, "")}`,
      missionId,
      occurredAt: new Date().toISOString(),
      eventType: "EVIDENCE_EVALUATED",
      summary: `Evaluated evidence. Accepted: ${String(isAccepted)}. Reason: ${reason}`
    });
  }

  async recordOutcome(missionId: string, outcome: any): Promise<void> {
    await this.store.appendHistory({
      historyId: `hist_${crypto.randomUUID().replace(/-/g, "")}`,
      missionId,
      occurredAt: new Date().toISOString(),
      eventType: "MISSION_CONCLUDED",
      summary: `Mission concluded.`,
      outcome
    });
  }
}
