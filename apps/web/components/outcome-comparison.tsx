import type { FollowThroughMission } from "@actionos/runtime/case-runner";
import type { EvidenceRecord } from "@actionos/runtime/evidence-service";
import { outcomeComparison } from "../lib/outcome-comparison";

export function OutcomeComparison({
  item,
  evidence
}: {
  readonly item: FollowThroughCase;
  readonly evidence: readonly EvidenceRecord[];
}) {
  const rows = outcomeComparison(item, evidence);
  if (rows.length === 0) return null;
  return <section className="card outcome-comparison" aria-labelledby="outcome-comparison-title">
    <div className="eyebrow">Proof check</div>
    <h2 id="outcome-comparison-title">Promised vs. observed</h2>
    <p>ActionOS only uses facts explicitly found in the company evidence. Missing facts stay missing.</p>
    <div className="comparison-table" role="table" aria-label="Promised versus observed evidence">
      <div className="comparison-head" role="row"><strong role="columnheader">Field</strong><strong role="columnheader">Promised</strong><strong role="columnheader">Observed</strong></div>
      {rows.map((row) => <div role="row" key={row.label} data-status={row.status}>
        <strong role="cell">{row.label}</strong><span role="cell">{row.promised}</span><span role="cell">{row.observed}<small>{row.status === "MATCH" ? " Matches" : row.status === "MISSING" ? " Missing" : " Different"}</small></span>
      </div>)}
    </div>
  </section>;
}
