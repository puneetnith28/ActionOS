import type { ConsumerCaseDetail } from "../lib/mission-projection";
import { MissionDecisionStory } from "./mission-decision-story";
import { ResultVerdict } from "./result-verdict";

const previewDetail: ConsumerCaseDetail = {
  missionId: "demo-verified",
  version: 7,
  state: "DONE",
  statusLabel: "Company evidence accepted",
  nextAction: "Check the result in the underlying account",
  goal: "Refund USD 59.00 for order ORDER-1842",
  counterpartyName: "Northstar Store",
  updatedAt: "2026-08-22T15:44:00.000Z",
  attemptCount: 2,
  channel: {
    type: "CONTROLLED_SANDBOX",
    label: "Controlled demo",
    disclosure: "Accelerated controlled merchant simulation.",
    contact: "Bounded sandbox request",
    reply: "Signed merchant callback",
    recipientHint: "Controlled endpoint"
  },
  returnPath: "Durable mission page",
  outcome: {
    accepted: true,
    acknowledgementOnly: true,
    title: "Company confirmation verified",
    explanation: "Signed evidence matched the approved case, amount, currency, and reference.",
    limitation: "Bank settlement is not verified. Check your payment account before treating the money as received."
  },
  conversation: [],
  comparison: [],
  notifications: [],
  interventions: [],
  timeline: [],
  technicalTraceEligible: false
};

export function MissionResultPreview() {
  return <div className="result-grid consumer-mission-detail">
    <ResultVerdict detail={previewDetail} />
    <MissionDecisionStory detail={previewDetail} />
    <p className="dev-preview-note">Development-only visual preview · synthetic data</p>
  </div>;
}
