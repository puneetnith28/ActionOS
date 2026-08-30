import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const STUDY_COLUMNS = [
  "participant_id",
  "consent",
  "problem_multi_step",
  "problem_delay_or_abandonment",
  "problem_evidence_description",
  "choice",
  "choice_reason",
  "completed_intake_approval_without_help",
  "completion_seconds",
  "explained_action",
  "explained_prohibition",
  "explained_shared_data",
  "explained_required_evidence",
  "distinguished_acknowledgement",
  "found_controls",
  "errors",
  "help_requested",
  "notes"
] as const;

type Column = (typeof STUDY_COLUMNS)[number];
export type StudyRow = Record<Column, string>;

function parseCsvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else field += character;
    } else if (character === '"') quoted = true;
    else if (character === ",") {
      row.push(field);
      field = "";
    } else if (character === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
  }
  if (quoted) throw new Error("CSV_UNCLOSED_QUOTE");
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((item) => item.some((value) => value.trim().length));
}

export function parseAndValidateStudyCsv(input: string): StudyRow[] {
  const [header, ...records] = parseCsvRows(input);
  if (!header || header.join(",") !== STUDY_COLUMNS.join(",")) {
    throw new Error("STUDY_HEADER_MISMATCH");
  }
  if (records.length !== 8) throw new Error(`STUDY_REQUIRES_EXACTLY_8_ROWS:${records.length}`);

  const expectedIds = new Set(Array.from({ length: 8 }, (_, index) => `P0${index + 1}`));
  const booleanColumns: Column[] = [
    "consent",
    "problem_multi_step",
    "problem_delay_or_abandonment",
    "completed_intake_approval_without_help",
    "explained_action",
    "explained_prohibition",
    "explained_shared_data",
    "explained_required_evidence",
    "distinguished_acknowledgement",
    "found_controls",
    "help_requested"
  ];

  return records.map((record, index) => {
    if (record.length !== STUDY_COLUMNS.length) {
      throw new Error(`STUDY_COLUMN_COUNT:${index + 2}:${record.length}`);
    }
    const row = Object.fromEntries(
      STUDY_COLUMNS.map((column, offset) => [column, record[offset]!.trim()])
    ) as StudyRow;
    if (!expectedIds.delete(row.participant_id))
      throw new Error(`STUDY_PARTICIPANT_ID:${row.participant_id}`);
    for (const column of booleanColumns) {
      if (!new Set(["yes", "no"]).has(row[column])) {
        throw new Error(`STUDY_BOOLEAN:${row.participant_id}:${column}`);
      }
    }
    if (row.consent !== "yes") throw new Error(`STUDY_WITHOUT_CONSENT:${row.participant_id}`);
    if (!new Set(["reminder", "dueback"]).has(row.choice)) {
      throw new Error(`STUDY_CHOICE:${row.participant_id}`);
    }
    const seconds = Number(row.completion_seconds);
    if (!Number.isFinite(seconds) || seconds <= 0) {
      throw new Error(`STUDY_COMPLETION_SECONDS:${row.participant_id}`);
    }
    for (const column of ["problem_evidence_description", "choice_reason"] as const) {
      if (!row[column]) throw new Error(`STUDY_REQUIRED_TEXT:${row.participant_id}:${column}`);
    }
    return row;
  });
}

const countYes = (rows: StudyRow[], column: Column): number =>
  rows.filter((row) => row[column] === "yes").length;
const markdownCell = (value: string): string =>
  value.replaceAll("|", "\\|").replaceAll("\r", " ").replaceAll("\n", " ").trim();

export function renderStudyReport(rows: StudyRow[]): string {
  const withoutHelp = countYes(rows, "completed_intake_approval_without_help");
  const underThreeMinutes = rows.filter((row) => Number(row.completion_seconds) < 180).length;
  const explainedAll = rows.filter((row) =>
    [
      "explained_action",
      "explained_prohibition",
      "explained_shared_data",
      "explained_required_evidence"
    ].every((column) => row[column as Column] === "yes")
  ).length;
  const distinguished = countYes(rows, "distinguished_acknowledgement");
  const choseDueBack = rows.filter((row) => row.choice === "dueback").length;
  const metric = (label: string, value: number, threshold: number) =>
    `| ${label} | ${value}/8 | ≥${threshold}/8 | ${value >= threshold ? "PASS" : "FAIL"} |`;

  return `# User Study Report

Status: **complete**. Denominator: 8 consented adult participants. Study version: 1.0.

## Predeclared outcomes

| Measure | Observed | Threshold | Result |
| --- | ---: | ---: | --- |
${metric("Completed intake and approval without help", withoutHelp, 6)}
${metric("Completed in under three minutes", underThreeMinutes, 6)}
${metric("Explained action, prohibition, shared data, and evidence", explainedAll, 6)}
${metric("Distinguished acknowledgement from resolution", distinguished, 7)}
${metric("Chose limited delegation over reminder/draft", choseDueBack, 5)}

## Participant-level audit table

| ID | No-help completion | Seconds | Explained all boundaries | Distinguished acknowledgement | Choice | Errors | Help requested |
| --- | --- | ---: | --- | --- | --- | --- | --- |
${rows
  .map(
    (row) =>
      `| ${row.participant_id} | ${row.completed_intake_approval_without_help} | ${row.completion_seconds} | ${
        [
          "explained_action",
          "explained_prohibition",
          "explained_shared_data",
          "explained_required_evidence"
        ].every((column) => row[column as Column] === "yes")
          ? "yes"
          : "no"
      } | ${row.distinguished_acknowledgement} | ${row.choice} | ${markdownCell(row.errors) || "none recorded"} | ${row.help_requested} |`
  )
  .join("\n")}

## Interpretation rules

These are observed usability and preference outcomes for eight participants using one synthetic
fixture. They are not evidence of market size, recovered money, retention, production accuracy, or
causal impact. Failures remain in the table and must inform the next UX revision.

Source data: [user-study-results.csv](./user-study-results.csv). Protocol and thresholds:
[user-study-protocol.md](./user-study-protocol.md).
`;
}

async function main(): Promise<void> {
  const source = process.env.DUEBACK_STUDY_CSV ?? "docs/research/user-study-results.csv";
  const destination = process.env.DUEBACK_STUDY_REPORT ?? "docs/research/user-study-report.md";
  const rows = parseAndValidateStudyCsv(await readFile(source, "utf8"));
  await writeFile(destination, renderStudyReport(rows), "utf8");
  process.stdout.write(`Validated 8 consented rows and wrote ${destination}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await main();
}
