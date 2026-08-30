import type { FollowThroughMission } from "@actionos/runtime/mission-runner";
import type { AnalysisJob } from "@actionos/contracts";

export type CaseBucket = "NEEDS_YOU" | "WORKING" | "DONE";

export interface CaseSummary {
  missionId: string;
  companyName: string;
  outcomeLabel: string;
  bucket: CaseBucket;
  statusLabel: string;
  lastActivityAt: string;
  nextStepLabel: string;
  attentionRequired: boolean;
  channelLabel: string;
  detailPath?: string;
}

export interface OwnerCaseStore {
  listByOwner(ownerId: string, limit: number): Promise<readonly FollowThroughMission[]>;
}

function analysisSummary(job: AnalysisJob): CaseSummary {
  return {
    missionId: job.missionId,
    companyName: "New promise",
    outcomeLabel: job.mediaType === "text/plain" ? "Reading pasted promise" : "Reading uploaded promise",
    bucket: job.status === "FAILED" ? "NEEDS_YOU" : "WORKING",
    statusLabel: job.status === "FAILED" ? "Analysis needs a retry" : "Gemini is building the plan",
    lastActivityAt: job.updatedAt,
    nextStepLabel: job.status === "FAILED"
      ? "Open this promise and retry safely"
      : "You can leave — ActionOS will keep working",
    attentionRequired: job.status === "FAILED",
    channelLabel: "Private analysis",
    detailPath: `/cases/${job.missionId}/analyzing`
  };
}

interface CaseCursor {
  version: 1;
  missionId: string;
  lastActivityAt: string;
  bucket: CaseBucket | null;
}

function encodeCursor(item: CaseSummary, requestedBucket: CaseBucket | null): string {
  return Buffer.from(JSON.stringify({
    version: 1,
    missionId: item.missionId,
    lastActivityAt: item.lastActivityAt,
    bucket: requestedBucket
  } satisfies CaseCursor)).toString("base64url");
}

function decodeCursor(value: string, requestedBucket: CaseBucket | null): CaseCursor {
  try {
    if (value.length > 512) throw new Error("CURSOR_INVALID");
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Partial<CaseCursor>;
    if (parsed.version !== 1 || typeof parsed.missionId !== "string" ||
      !parsed.missionId.startsWith("mission_") || typeof parsed.lastActivityAt !== "string" ||
      Number.isNaN(Date.parse(parsed.lastActivityAt)) || (parsed.bucket ?? null) !== requestedBucket) {
      throw new Error("CURSOR_INVALID");
    }
    return parsed as CaseCursor;
  } catch {
    throw new Error("CURSOR_INVALID");
  }
}

function bucket(state: FollowThroughMission["state"]): CaseBucket {
  if (["NEEDS_ATTENTION", "FAILED"].includes(state)) return "NEEDS_YOU";
  if (["DONE", "CANCELLED", "EXPIRED"].includes(state)) return "DONE";
  return "WORKING";
}

const status: Record<FollowThroughMission["state"], string> = {
  DRAFT: "Draft",
  AWAITING_APPROVAL: "Ready for your review",
  READY: "Scheduled",
  RUNNING: "Contacting the company",
  WAITING_EXTERNAL: "Waiting for the company",
  WAITING_RETRY: "Retrying safely",
  NEEDS_ATTENTION: "Needs your decision",
  DONE: "Proof accepted",
  FAILED: "Could not continue",
  CANCELLED: "Stopped",
  EXPIRED: "Approval expired"
};

function nextStep(item: FollowThroughMission): string {
  if (item.state === "NEEDS_ATTENTION") return "Review one decision";
  if (item.state === "DONE") return "Review the proof and limitation";
  if (item.state === "FAILED") return "Review why ActionOS stopped";
  if (["CANCELLED", "EXPIRED"].includes(item.state)) return "No further action is authorized";
  if (item.state === "AWAITING_APPROVAL" || item.state === "DRAFT") return "Review and approve the plan";
  return "ActionOS will keep this open until there is proof";
}

function companyName(item: FollowThroughMission): string {
  return item.plan.counterpartyName?.trim() || "Company";
}

export function caseSummary(item: FollowThroughMission): CaseSummary {
  const requirement = item.plan.evidenceRequirements[0];
  return {
    missionId: item.missionId,
    companyName: companyName(item).replace(/(^|[-_])\w/g, (value) => value.replace(/[-_]/, " ").toUpperCase()),
    outcomeLabel: requirement?.subject ?? item.plan.messageSubject ?? "Company promise",
    bucket: bucket(item.state),
    statusLabel: status[item.state],
    lastActivityAt: item.updatedAt ?? item.lastAttemptAt ?? item.controlledAt ?? item.dueAt,
    nextStepLabel: nextStep(item),
    attentionRequired: bucket(item.state) === "NEEDS_YOU",
    channelLabel: item.plan.channelType === "MANAGED_EMAIL" ? "Email" : "Controlled demo"
  };
}

export async function handleCases(
  request: Request,
  dependencies: {
    authenticate: (request: Request) => Promise<{ uid: string }>;
    store: OwnerCaseStore;
    analysisStore?: { listByOwner(ownerId: string, limit: number): Promise<readonly AnalysisJob[]> };
  }
): Promise<Response> {
  const privateHeaders = { "Cache-Control": "private, no-store" };
  try {
    const owner = await dependencies.authenticate(request);
    const url = new URL(request.url);
    const requestedLimit = Number(url.searchParams.get("limit") ?? 10);
    const limit = Number.isInteger(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 25) : 10;
    const bucketParam = url.searchParams.get("bucket");
    const requestedBucket = bucketParam && ["NEEDS_YOU", "WORKING", "DONE"].includes(bucketParam)
      ? bucketParam as CaseBucket
      : null;
    if (bucketParam && !requestedBucket) throw new Error("BUCKET_INVALID");
    const [runtimeCases, analysisJobs] = await Promise.all([
      dependencies.store.listByOwner(owner.uid, 50),
      dependencies.analysisStore?.listByOwner(owner.uid, 50) ?? Promise.resolve([])
    ]);
    const runtimeIds = new Set(runtimeCases.map((item) => item.missionId));
    const ordered = [
      ...runtimeCases.map(caseSummary),
      ...analysisJobs
        .filter((job) => job.status !== "READY" && !runtimeIds.has(job.missionId))
        .map(analysisSummary)
    ]
      .filter((item) => !requestedBucket || item.bucket === requestedBucket)
      .sort((left, right) => right.lastActivityAt.localeCompare(left.lastActivityAt) || left.missionId.localeCompare(right.missionId));
    const cursorParam = url.searchParams.get("cursor");
    const cursor = cursorParam ? decodeCursor(cursorParam, requestedBucket) : undefined;
    const start = cursor
      ? ordered.findIndex((item) => item.missionId === cursor.missionId && item.lastActivityAt === cursor.lastActivityAt) + 1
      : 0;
    if (cursor && start === 0) throw new Error("CURSOR_INVALID");
    const items = ordered.slice(start, start + limit);
    const hasMore = start + items.length < ordered.length;
    const lastItem = items.at(-1);
    const nextCursor = hasMore && lastItem
      ? encodeCursor(lastItem, requestedBucket)
      : null;
    return Response.json({ items, nextCursor }, { headers: privateHeaders });
  } catch (error) {
    const code = error instanceof Error ? error.message : "CASES_FAILED";
    const authenticationError = ["AUTHENTICATION_REQUIRED", "INVALID_ID_TOKEN"].includes(code);
    const requestError = ["CURSOR_INVALID", "BUCKET_INVALID"].includes(code);
    return Response.json(
      { error: authenticationError || requestError ? code : "CASES_FAILED" },
      { status: authenticationError ? 401 : requestError ? 400 : 500, headers: privateHeaders }
    );
  }
}
