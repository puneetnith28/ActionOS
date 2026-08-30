import type { FollowThroughMission } from "@actionos/runtime/case-runner";
import type { EvidenceRecord } from "@actionos/runtime/evidence-service";

export interface OutcomeComparisonRow {
  label: string;
  promised: string;
  observed: string;
  status: "MATCH" | "MISSING" | "CONFLICT";
}

function evidenceLabel(status: string | undefined): string | undefined {
  if (status === "OUTCOME_CONFIRMED") return "Company confirmed the outcome";
  if (status === "ACTION_ATTEMPTED") return "Company acknowledged the request";
  if (status === "DELIVERY_CONFIRMED") return "Delivery confirmed";
  return status;
}

function money(amountMinor: number | undefined, currency: string | undefined): string | undefined {
  if (amountMinor === undefined) return undefined;
  return currency ? `${currency} ${(amountMinor / 100).toFixed(2)}` : (amountMinor / 100).toFixed(2);
}

export function outcomeComparison(
  item: FollowThroughCase,
  evidence: readonly EvidenceRecord[]
): OutcomeComparisonRow[] {
  const requirement = item.plan.evidenceRequirements[0];
  if (!requirement) return [];
  const record = [...evidence].reverse().find((entry) =>
    entry.verification.accepted || entry.candidate.status !== "ACTION_ATTEMPTED"
  ) ?? evidence.at(-1);
  const candidate = record?.candidate;
  const row = (label: string, promised: string | undefined, observed: string | undefined) => {
    if (promised === undefined) return undefined;
    return {
      label,
      promised,
      observed: observed ?? "Not stated in the reply",
      status: observed === undefined ? "MISSING" as const : observed === promised ? "MATCH" as const : "CONFLICT" as const
    };
  };
  return [
    row("Proof level", evidenceLabel(requirement.minimumStatus), evidenceLabel(candidate?.status)),
    row("Reference", requirement.transactionRef, candidate?.transactionRef),
    row("Amount", money(requirement.amountMinor, requirement.currency), money(candidate?.amountMinor, candidate?.currency)),
    row("Currency", requirement.currency, candidate?.currency),
    row("Subject", requirement.subject, candidate?.subject),
    row("Bill period", requirement.billPeriod, candidate?.billPeriod),
    row("Tracking", requirement.requiredOutcomeFields?.includes("trackingNumber") ? "Required" : undefined, candidate?.trackingNumber ? "Required" : undefined)
  ].filter((value): value is OutcomeComparisonRow => value !== undefined);
}
