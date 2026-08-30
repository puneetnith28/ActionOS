import { describe, expect, it } from "vitest";
import {
  parseAndValidateStudyCsv,
  renderStudyReport,
  STUDY_COLUMNS
} from "../../scripts/research/report";

function row(id: string, overrides: Record<string, string> = {}): string {
  const values: Record<string, string> = {
    participant_id: id,
    consent: "yes",
    problem_multi_step: "yes",
    problem_delay_or_abandonment: "yes",
    problem_evidence_description: "A merchant confirmation",
    choice: "actionos",
    choice_reason: "It follows through within limits",
    completed_intake_approval_without_help: "yes",
    completion_seconds: "120",
    explained_action: "yes",
    explained_prohibition: "yes",
    explained_shared_data: "yes",
    explained_required_evidence: "yes",
    distinguished_acknowledgement: "yes",
    found_controls: "yes",
    errors: "",
    help_requested: "no",
    notes: ""
  };
  return STUDY_COLUMNS.map((column) => overrides[column] ?? values[column]).join(",");
}

const validCsv = [
  STUDY_COLUMNS.join(","),
  ...Array.from({ length: 8 }, (_, index) => row(`P0${index + 1}`))
].join("\n");

describe("user-study evidence reporting", () => {
  it("validates exactly eight consented unique participants and renders denominators", () => {
    const rows = parseAndValidateStudyCsv(validCsv);
    const report = renderStudyReport(rows);
    expect(rows).toHaveLength(8);
    expect(report).toContain("Denominator: 8 consented adult participants");
    expect(report).toContain(
      "| Chose limited delegation over reminder/draft | 8/8 | ≥5/8 | PASS |"
    );
  });

  it("rejects missing participants instead of manufacturing a result", () => {
    expect(() => parseAndValidateStudyCsv(validCsv.split("\n").slice(0, -1).join("\n"))).toThrow(
      "STUDY_REQUIRES_EXACTLY_8_ROWS:7"
    );
  });

  it("rejects records without consent", () => {
    const invalid = validCsv.replace("P01,yes,", "P01,no,");
    expect(() => parseAndValidateStudyCsv(invalid)).toThrow("STUDY_WITHOUT_CONSENT:P01");
  });

  it("retains failures in the generated audit table", () => {
    const invalidOutcome = validCsv.replace(
      row("P08"),
      row("P08", {
        completed_intake_approval_without_help: "no",
        completion_seconds: "240",
        distinguished_acknowledgement: "no",
        choice: "reminder",
        errors: '"mistook acknowledgement, then corrected"',
        help_requested: "yes"
      })
    );
    const report = renderStudyReport(parseAndValidateStudyCsv(invalidOutcome));
    expect(report).toContain(
      "| P08 | no | 240 | yes | no | reminder | mistook acknowledgement, then corrected | yes |"
    );
    expect(report).toContain("| Completed intake and approval without help | 7/8 | ≥6/8 | PASS |");
  });
});
