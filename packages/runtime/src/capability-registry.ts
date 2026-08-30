import type { ChannelCapability, ChannelType } from "@actionos/contracts";
import type { ClosedActionAdapter } from "./action-broker";
import type { ActionReceipt } from "./action-broker";
import type { ProposedAction } from "@actionos/domain";

export interface RegisteredCapability {
  readonly capability: ChannelCapability;
  readonly adapter?: ClosedActionAdapter;
}

export class RoutingCapabilityAdapter implements ClosedActionAdapter {
  constructor(private readonly registry: CapabilityRegistry) {}

  execute(
    proposal: ProposedAction,
    idempotencyKey: string,
    context: { readonly missionId: string; readonly correlationId?: string }
  ): Promise<ActionReceipt> {
    const channelType = proposal.channelType;
    if (!channelType || ![
      "CONTROLLED_SANDBOX",
      "MANAGED_EMAIL",
      "GMAIL_CONNECTED",
      "PARTNER_API"
    ].includes(channelType)) {
      throw new Error("CONTACT_CHANNEL_INVALID");
    }
    return this.registry.requireAvailable(channelType as ChannelType).execute(
      proposal,
      idempotencyKey,
      context
    );
  }
}

export class CapabilityRegistry {
  private readonly channels: ReadonlyMap<ChannelType, RegisteredCapability>;

  constructor(channels: readonly RegisteredCapability[]) {
    this.channels = new Map(channels.map((channel) => [channel.capability.channelType, channel]));
  }

  list(): readonly ChannelCapability[] {
    return [...this.channels.values()].map(({ capability }) => capability);
  }

  requireAvailable(channelType: ChannelType): ClosedActionAdapter {
    const channel = this.channels.get(channelType);
    if (!channel || channel.capability.status !== "AVAILABLE" || !channel.capability.canSend) {
      throw new Error("CONTACT_CHANNEL_UNAVAILABLE");
    }
    if (!channel.adapter) throw new Error("CONTACT_CHANNEL_NOT_CONFIGURED");
    return channel.adapter;
  }
}

export function publicCapabilities(input: {
  readonly now: string;
  readonly sandboxAvailable: boolean;
  readonly managedEmailOutbound: boolean;
  readonly managedEmailInbound: boolean;
  readonly partnerFixtureAvailable?: boolean;
}): readonly ChannelCapability[] {
  const emailAvailable = input.managedEmailOutbound && input.managedEmailInbound;
  return [
    {
      channelType: "CONTROLLED_SANDBOX",
      status: input.sandboxAvailable ? "AVAILABLE" : "UNAVAILABLE",
      canSend: input.sandboxAvailable,
      canReceive: input.sandboxAvailable,
      supportsThreading: false,
      supportsDeliveryReceipt: input.sandboxAvailable,
      supportsAuthenticatedReply: input.sandboxAvailable,
      requiresUserOAuth: false,
      reasonCodes: [input.sandboxAvailable ? "CONTROLLED_DEMO_CONFIGURED" : "SANDBOX_NOT_CONFIGURED"],
      checkedAt: input.now
    },
    {
      channelType: "MANAGED_EMAIL",
      status: emailAvailable ? "AVAILABLE" : "UNAVAILABLE",
      canSend: input.managedEmailOutbound,
      canReceive: input.managedEmailInbound,
      supportsThreading: input.managedEmailInbound,
      supportsDeliveryReceipt: input.managedEmailOutbound,
      supportsAuthenticatedReply: input.managedEmailInbound,
      requiresUserOAuth: false,
      reasonCodes: [emailAvailable ? "EMAIL_BIDIRECTIONAL_CONFIGURED" : "EMAIL_GATE_INCOMPLETE"],
      checkedAt: input.now
    },
    {
      channelType: "GMAIL_CONNECTED",
      status: "FUTURE",
      canSend: false,
      canReceive: false,
      supportsThreading: true,
      supportsDeliveryReceipt: false,
      supportsAuthenticatedReply: false,
      requiresUserOAuth: true,
      reasonCodes: ["GMAIL_GATE_D_NOT_ACCEPTED"],
      checkedAt: input.now
    },
    {
      channelType: "PARTNER_API",
      status: input.partnerFixtureAvailable ? "AVAILABLE" : "FUTURE",
      canSend: input.partnerFixtureAvailable ?? false,
      canReceive: false,
      supportsThreading: false,
      supportsDeliveryReceipt: true,
      supportsAuthenticatedReply: true,
      requiresUserOAuth: false,
      reasonCodes: [input.partnerFixtureAvailable ? "CONTROLLED_PARTNER_FIXTURE" : "PARTNER_FIXTURE_NOT_CONFIGURED"],
      checkedAt: input.now
    }
  ];
}
