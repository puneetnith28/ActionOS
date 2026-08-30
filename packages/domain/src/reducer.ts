import type { MissionSnapshot, MissionState, DomainEvent, TransitionCommand } from "./types";

const transitions: Readonly<Record<MissionState, readonly MissionState[]>> = {
  DRAFT: ["AWAITING_APPROVAL", "CANCELLED", "EXPIRED"],
  AWAITING_APPROVAL: ["DRAFT", "READY", "CANCELLED", "EXPIRED"],
  READY: ["RUNNING", "CANCELLED", "EXPIRED"],
  RUNNING: [
    "WAITING_EXTERNAL",
    "WAITING_RETRY",
    "NEEDS_ATTENTION",
    "DONE",
    "FAILED",
    "CANCELLED",
    "EXPIRED"
  ],
  WAITING_EXTERNAL: ["RUNNING", "WAITING_RETRY", "NEEDS_ATTENTION", "CANCELLED", "EXPIRED"],
  WAITING_RETRY: ["READY", "NEEDS_ATTENTION", "CANCELLED", "EXPIRED"],
  NEEDS_ATTENTION: ["READY", "CANCELLED", "EXPIRED"],
  DONE: ["NEEDS_ATTENTION"],
  FAILED: ["NEEDS_ATTENTION"],
  CANCELLED: [],
  EXPIRED: []
};

export class DomainTransitionError extends Error {
  constructor(
    message: string,
    readonly code:
      | "VERSION_CONFLICT"
      | "ILLEGAL_TRANSITION"
      | "BOUNDARY_REQUIRED"
      | "BOUNDARY_MISMATCH"
      | "VERIFICATION_REQUIRED"
  ) {
    super(message);
  }
}

function assertBoundary(snapshot: MissionSnapshot, command: TransitionCommand): void {
  const boundary = command.boundary ?? snapshot.boundary;
  if (!boundary)
    throw new DomainTransitionError("Current plan has no boundary", "BOUNDARY_REQUIRED");
  if (
    boundary.ownerId !== snapshot.ownerId ||
    boundary.planVersion !== snapshot.planVersion ||
    boundary.planHash !== snapshot.planHash
  ) {
    throw new DomainTransitionError(
      "Approval does not match owner and current plan",
      "BOUNDARY_MISMATCH"
    );
  }
  if (Date.parse(boundary.expiresAt) <= Date.now() || boundary.revokedAt) {
    throw new DomainTransitionError("Approval is expired or revoked", "BOUNDARY_MISMATCH");
  }
}

export function reduceMission(
  snapshot: MissionSnapshot,
  command: TransitionCommand
): { snapshot: MissionSnapshot; event: DomainEvent } {
  if (command.expectedVersion !== snapshot.version) {
    throw new DomainTransitionError("Mission version changed", "VERSION_CONFLICT");
  }
  if (!transitions[snapshot.state].includes(command.target)) {
    throw new DomainTransitionError(
      `Illegal transition ${snapshot.state} -> ${command.target}`,
      "ILLEGAL_TRANSITION"
    );
  }
  if (["READY", "RUNNING", "WAITING_EXTERNAL", "WAITING_RETRY", "DONE"].includes(command.target)) {
    assertBoundary(snapshot, command);
  }
  if (command.target === "DONE" && !command.verification?.accepted) {
    throw new DomainTransitionError(
      "DONE requires accepted deterministic verification",
      "VERIFICATION_REQUIRED"
    );
  }

  const next: MissionSnapshot = {
    ...snapshot,
    state: command.target,
    version: snapshot.version + 1,
    ...(command.boundary ? { boundary: command.boundary } : {}),
    ...(command.target === "DONE" && command.verification?.status
      ? { completedStatus: command.verification.status }
      : {})
  };

  return {
    snapshot: next,
    event: {
      type: "MISSION_STATE_CHANGED",
      missionId: snapshot.missionId,
      from: snapshot.state,
      to: command.target,
      reasonCode: command.reasonCode,
      actor: command.actor
    }
  };
}
