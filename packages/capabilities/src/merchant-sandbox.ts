import type { ProposedCapabilityExecution } from "@actionos/domain";
import type { ExecutionReceipt, CapabilityExecutor } from "@actionos/runtime/capability-broker";

export interface MerchantSandboxAdapterConfig {
  readonly baseUrl: string;
  readonly scenario: string;
  readonly actionSecret?: string;
  readonly fetch?: typeof globalThis.fetch;
}

export class MerchantSandboxAdapter implements CapabilityExecutor {
  private readonly request: typeof globalThis.fetch;

  constructor(private readonly config: MerchantSandboxAdapterConfig) {
    this.request = config.fetch ?? globalThis.fetch;
  }

  async execute(
    proposal: ProposedCapabilityExecution,
    idempotencyKey: string,
    context: { readonly missionId: string; readonly correlationId?: string }
  ): Promise<ExecutionReceipt> {
    const response = await this.request(`${this.config.baseUrl}/v1/follow-ups`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
        "x-dueback-scenario": this.config.scenario,
        ...(context.correlationId ? { "x-dueback-correlation-id": context.correlationId } : {}),
        ...(this.config.actionSecret ? { authorization: `Bearer ${this.config.actionSecret}` } : {})
      },
      body: JSON.stringify({ missionId: context.missionId, proposal })
    });
    if (!response.ok) throw new Error(`MERCHANT_SANDBOX_${String(response.status)}`);
    const receipt = (await response.json()) as ExecutionReceipt;
    if (!receipt.receiptId || !receipt.acceptedAt) throw new Error("INVALID_MERCHANT_RECEIPT");
    return receipt;
  }
}
