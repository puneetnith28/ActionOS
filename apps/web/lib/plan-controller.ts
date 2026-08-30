import type { PlanService, TrustedChannelSelection } from "@actionos/runtime/plan-service";

export interface PlanControllerDependencies {
  readonly authenticate: (request: Request) => Promise<{
    uid: string;
    email?: string;
    email_verified?: boolean;
    firebase?: { sign_in_provider?: string };
  }>;
  readonly service: PlanService;
  readonly now: () => string;
  readonly isChannelAvailable?: (channelType: string | undefined) => boolean;
  readonly resolveChannel?: (channelType: string) => TrustedChannelSelection | undefined;
  readonly isRecoverableOwner?: (owner: {
    uid: string;
    firebase?: { sign_in_provider?: string };
  }) => boolean;
}

export async function handlePlanRequest(
  request: Request,
  missionId: string,
  dependencies: PlanControllerDependencies
): Promise<Response> {
  try {
    const owner = await dependencies.authenticate(request);
    if (request.method === "GET") {
      return Response.json(await dependencies.service.inspect(missionId, owner.uid));
    }
    const body = (await request.json()) as {
      action?: string;
      expectedPlanVersion?: number;
      expectedPlanHash?: string;
      revision?: Record<string, unknown>;
    };
    if (body.action === "simulate") {
      return Response.json(await dependencies.service.simulate(missionId, owner.uid));
    }
    if (body.action === "select-channel" && body.expectedPlanVersion !== undefined) {
      const channelType = body.revision?.channelType;
      const selected = typeof channelType === "string"
        ? dependencies.resolveChannel?.(channelType)
        : undefined;
      if (!selected || !dependencies.isChannelAvailable?.(selected.channelType)) {
        return Response.json({ error: "CONTACT_CHANNEL_UNAVAILABLE" }, { status: 409 });
      }
      return Response.json(await dependencies.service.selectChannel(
        missionId,
        owner.uid,
        body.expectedPlanVersion,
        selected
      ));
    }
    if (body.action === "revise" && body.expectedPlanVersion !== undefined) {
      return Response.json(
        await dependencies.service.revise(
          missionId,
          owner.uid,
          body.expectedPlanVersion,
          body.revision ?? {}
        )
      );
    }
    if (
      body.action === "approve" &&
      body.expectedPlanVersion !== undefined &&
      body.expectedPlanHash
    ) {
      const draft = await dependencies.service.inspect(missionId, owner.uid);
      if (dependencies.isChannelAvailable && !dependencies.isChannelAvailable(draft.plan.channelType)) {
        return Response.json({ error: "CONTACT_CHANNEL_UNAVAILABLE" }, { status: 409 });
      }
      if (
        draft.plan.channelType === "MANAGED_EMAIL" &&
        dependencies.isRecoverableOwner &&
        !dependencies.isRecoverableOwner(owner)
      ) {
        return Response.json({ error: "RECOVERABLE_IDENTITY_REQUIRED" }, { status: 409 });
      }
      if (draft.plan.channelType === "MANAGED_EMAIL" && draft.plan.notificationRecipient) {
        const verifiedEmail = owner.firebase?.sign_in_provider === "anonymous"
          ? undefined
          : "email" in owner && typeof owner.email === "string" && owner.email_verified === true
            ? owner.email.toLowerCase()
            : undefined;
        if (!verifiedEmail || verifiedEmail !== draft.plan.notificationRecipient.toLowerCase()) {
          return Response.json({ error: "VERIFIED_NOTIFICATION_EMAIL_REQUIRED" }, { status: 409 });
        }
      }
      return Response.json(
        await dependencies.service.approve({
          missionId,
          ownerId: owner.uid,
          expectedPlanVersion: body.expectedPlanVersion,
          expectedPlanHash: body.expectedPlanHash,
          now: dependencies.now()
        })
      );
    }
    if (body.action === "reject" && body.expectedPlanVersion !== undefined) {
      return Response.json(
        await dependencies.service.reject(missionId, owner.uid, body.expectedPlanVersion)
      );
    }
    if (body.action === "delete") {
      await dependencies.service.deleteDraft(missionId, owner.uid);
      return Response.json({ status: "DRAFT_DELETED" }, { status: 202 });
    }
    return Response.json({ error: "INVALID_PLAN_COMMAND" }, { status: 400 });
  } catch (cause) {
    const error = cause instanceof Error ? cause.message : "PLAN_COMMAND_FAILED";
    const status = error.includes("OWNERSHIP") ? 403 : error.includes("NOT_FOUND") ? 404 : 409;
    return Response.json({ error }, { status });
  }
}
