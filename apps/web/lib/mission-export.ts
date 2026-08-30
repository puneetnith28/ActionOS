import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import type { EvidenceRecord } from "@actionos/runtime/verification-service";
import { outcomeComparison } from "./outcome-comparison";

function redactReference(value: string): string {
  if (value.length <= 4) return "••••";
  return `••••${value.slice(-4)}`;
}

export function caseExportText(item: FollowThroughMission, verification: readonly EvidenceRecord[], generatedAt: string): string {
  const latest = verification.at(-1);
  const rows = outcomeComparison(item, verification).map((row) => ({
    ...row,
    promised: row.label === "Reference" ? redactReference(row.promised) : row.promised,
    observed: row.label === "Reference" && row.observed !== "Not stated in the reply"
      ? redactReference(row.observed)
      : row.observed
  }));
  const accepted = latest?.verification.accepted === true;
  const monetary = item.plan.evidenceRequirements.some((requirement) => requirement.amountMinor !== undefined);
  return [
    "DUEBACK CASE SUMMARY",
    `Generated: ${generatedAt}`,
    `Status: ${item.state === "DONE" ? "Evidence accepted" : item.state === "NEEDS_ATTENTION" ? "Decision needed" : "Still open"}`,
    `Promise: ${item.plan.goal}`,
    `Channel: ${item.plan.channelType === "MANAGED_EMAIL" ? "Managed email (controlled pilot)" : "Controlled demo"}`,
    "",
    "COMPANY STATEMENT",
    latest ? `Evidence status: ${latest.candidate.status}` : "No company verification recorded.",
    "",
    "DUEBACK DECISION",
    latest ? (accepted ? "The explicit verification met the approved contract." : `Not resolved: ${latest.verification.reasonCodes.join(", ")}.`) : "No verification decision yet.",
    "",
    "PROMISED VS OBSERVED",
    ...rows.map((row) => `${row.label}: promised ${row.promised}; observed ${row.observed}; ${row.status}.`),
    "",
    "LIMITATION",
    monetary
      ? "Company-confirmed refund verification is not bank settlement. Check the payment account."
      : "Company verification is not independent fulfillment. Check that the promised outcome arrived.",
    "",
    "This static summary grants no ActionOS access or control."
  ].join("\n");
}
