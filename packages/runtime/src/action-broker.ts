import { actionIdempotencyKey, validateCapabilityExecution, stableHash } from "@actionos/domain";
import type { CapabilityPolicy, AuthorizationDecision, ProposedCapabilityExecution } from "@actionos/domain";

export interface ActionReceipt {
  readonly receiptId: string;
  readonly acceptedAt: string;
  readonly missionId?: string;
  readonly channelType?: string;
  readonly providerMessageId?: string;
  readonly replyRoute?: string;
  readonly recipientFingerprint?: string;
  readonly correlationId?: string;
  readonly actionIdempotencyKey?: string;
}

export type Reservation =
  | { readonly status: "RESERVED" }
  | { readonly status: "IN_FLIGHT" }
  | { readonly status: "SUCCEEDED"; readonly receipt: ActionReceipt };

export interface ActionRecordStore {
  reserve(idempotencyKey: string): Promise<Reservation>;
  succeed(idempotencyKey: string, receipt: ActionReceipt): Promise<void>;
  fail(idempotencyKey: string, reasonCode: string): Promise<void>;
  markUnknown?(input: {
    idempotencyKey: string;
    missionId: string;
    ownerId: string;
    channelType: string;
    recipientFingerprint: string;
    correlationId?: string;
    reasonCode: string;
    observedAt: string;
  }): Promise<void>;
}

export interface ClosedActionAdapter {
  execute(
    proposal: ProposedCapabilityExecution,
    idempotencyKey: string,
    context: { readonly missionId: string; readonly correlationId?: string }
  ): Promise<ActionReceipt>;
}

export interface ExternalSendBudget {
  reserveExternalSend(input: {
    ownerId: string;
    missionId: string;
    recipient: string;
    channelType: string;
    requestedAt: string;
    idempotencyKey: string;
  }): Promise<void>;
}

export class ActionOutcomeUnknownError extends Error {
  idempotencyKey?: string;

  constructor(readonly reasonCode: string) {
    super(reasonCode);
    this.name = "ActionOutcomeUnknownError";
  }
}

export type BrokerResult =
  | { readonly status: "DENIED"; readonly decision: AuthorizationDecision }
  | { readonly status: "PENDING_DUPLICATE"; readonly idempotencyKey: string }
  | {
      readonly status: "SUCCEEDED";
      readonly idempotencyKey: string;
      readonly receipt: ActionReceipt;
      readonly duplicate: boolean;
    };

export class ActionBroker {
  constructor(
    private readonly store: ActionRecordStore,
    private readonly adapter: ClosedActionAdapter,
    private readonly budget?: ExternalSendBudget
  ) {}

  async execute(input: {
    readonly missionId: string;
    readonly actionOrdinal: number;
    readonly policy: CapabilityPolicy;
    readonly proposal: ProposedCapabilityExecution;
    readonly now: string;
    readonly correlationId?: string;
  }): Promise<BrokerResult> {
    const decision = validateCapabilityExecution(input.policy, input.proposal, input.now);
    if (!decision.authorized) return { status: "DENIED", decision };

    const idempotencyKey = actionIdempotencyKey({
      missionId: input.missionId,
      planVersion: input.proposal.planVersion,
      actionType: input.proposal.actionType,
      ordinal: input.actionOrdinal
    });
    const reservation = await this.store.reserve(idempotencyKey);
    if (reservation.status === "SUCCEEDED") {
      return {
        status: "SUCCEEDED",
        idempotencyKey,
        receipt: reservation.receipt,
        duplicate: true
      };
    }
    if (reservation.status === "IN_FLIGHT") {
      return { status: "PENDING_DUPLICATE", idempotencyKey };
    }

    try {
      await this.budget?.reserveExternalSend({
        ownerId: input.proposal.ownerId,
        missionId: input.missionId,
        recipient: input.proposal.recipient,
        channelType: input.proposal.channelType ?? "UNKNOWN",
        requestedAt: input.now,
        idempotencyKey
      });
      const providerReceipt = await this.adapter.execute(input.proposal, idempotencyKey, {
        missionId: input.missionId,
        ...(input.correlationId ? { correlationId: input.correlationId } : {})
      });
      const channelType = input.proposal.channelType ?? providerReceipt.channelType;
      const receipt: ActionReceipt = {
        ...providerReceipt,
        missionId: input.missionId,
        ...(channelType ? { channelType } : {}),
        actionIdempotencyKey: idempotencyKey,
        ...(input.correlationId ? { correlationId: input.correlationId } : {})
      };
      await this.store.succeed(idempotencyKey, receipt);
      return { status: "SUCCEEDED", idempotencyKey, receipt, duplicate: false };
    } catch (error) {
      // A timeout or malformed success response may occur after the provider accepted the action.
      // Keep the reservation IN_FLIGHT: retrying the same logical action blindly could duplicate it.
      if (error instanceof ActionOutcomeUnknownError) {
        error.idempotencyKey = idempotencyKey;
        await this.store.markUnknown?.({
          idempotencyKey,
          missionId: input.missionId,
          ownerId: input.proposal.ownerId,
          channelType: input.proposal.channelType ?? "UNKNOWN",
          recipientFingerprint: stableHash({
            namespace: "dueback/recipient/v1",
            recipient: input.proposal.recipient.toLowerCase()
          }),
          ...(input.correlationId ? { correlationId: input.correlationId } : {}),
          reasonCode: error.reasonCode,
          observedAt: input.now
        });
        throw error;
      }
      await this.store.fail(idempotencyKey, "ADAPTER_FAILURE");
      throw error;
    }
  }
}
