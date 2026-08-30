import type { MissionControlService } from "@actionos/runtime/mission-control";

export async function handleMissionControl(
  request: Request,
  missionId: string,
  dependencies: {
    authenticate: (request: Request) => Promise<{ uid: string }>;
    service: MissionControlService;
    now: () => string;
  }
): Promise<Response> {
  try {
    const owner = await dependencies.authenticate(request);
    const body = (await request.json()) as {
      action?: "STOP" | "REVOKE" | "EXPIRE" | "REOPEN" | "RESUME" | "REVISE" | "DELETE";
      expectedVersion?: number;
      reason?: string;
      idempotencyKey?: string;
    };
    if (!body.action || !Number.isInteger(body.expectedVersion) ||
      !body.idempotencyKey || !/^[A-Za-z0-9_-]{16,200}$/.test(body.idempotencyKey)) {
      return Response.json({ error: "INVALID_CONTROL_COMMAND" }, { status: 400 });
    }
    const result = await dependencies.service.command({
      missionId,
      ownerId: owner.uid,
      expectedVersion: body.expectedVersion as number,
      action: body.action,
      ...(body.reason ? { reason: body.reason } : {}),
      idempotencyKey: body.idempotencyKey,
      now: dependencies.now()
    });
    return Response.json(result, { status: body.action === "DELETE" ? 202 : 200 });
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "CONTROL_COMMAND_FAILED";
    const status = error.includes("OWNERSHIP")
      ? 403
      : error.includes("NOT_FOUND")
        ? 404
        : error.includes("AUTH")
          ? 401
          : 409;
    return Response.json({ error }, { status });
  }
}
