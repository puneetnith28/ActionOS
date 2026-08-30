import { createHmac } from "node:crypto";
import type { ProposedCapabilityExecution } from "@actionos/domain";
import type { ExecutionReceipt, CapabilityExecutor } from "@actionos/runtime/capability-broker";

export interface PartnerApiFixtureConfig {
  readonly endpoint: string;
  readonly signingSecret: string;
  readonly request?: typeof globalThis.fetch;
}

export class PartnerApiFixtureAdapter implements CapabilityExecutor {
  private readonly request: typeof globalThis.fetch;

  constructor(private readonly config: PartnerApiFixtureConfig) {
    const endpoint = new URL(config.endpoint);
    if (endpoint.pathname !== "/v1/actionos/actions") {
      throw new Error("PARTNER_ENDPOINT_NOT_ALLOWED");
    }
    if (endpoint.protocol !== "https:" && endpoint.hostname !== "127.0.0.1" && endpoint.hostname !== "localhost") {
      throw new Error("PARTNER_ENDPOINT_NOT_ALLOWED");
    }
    this.request = config.request ?? globalThis.fetch;
  }

  async execute(
    proposal: ProposedCapabilityExecution,
    idempotencyKey: string,
    context: { readonly missionId: string; readonly correlationId?: string }
  ): Promise<ExecutionReceipt> {
    const body = JSON.stringify({
      schemaVersion: "actionos.partner-action.v1",
      missionId: context.missionId,
      correlationId: context.correlationId,
      proposal
    });
    const signature = createHmac("sha256", this.config.signingSecret).update(body).digest("hex");
    const response = await this.request(this.config.endpoint, {
      method: "POST",
      headers: {
        "content-Type": "application/json",
        "idempotency-key": idempotencyKey,
        "x-actionos-signature": `sha256=${signature}`,
        ...(context.correlationId ? { "x-actionos-correlation-id": context.correlationId } : {})
      },
      body
    });
    if (!response.ok) throw new Error(`PARTNER_API_${String(response.status)}`);
    const receipt = (await response.json()) as Partial<ExecutionReceipt>;
    if (!receipt.receiptId || !receipt.acceptedAt) throw new Error("PARTNER_RECEIPT_INVALID");
    return { ...receipt, receiptId: receipt.receiptId, acceptedAt: receipt.acceptedAt,
      missionId: context.missionId, channelType: "PARTNER_API" };
  }
}
