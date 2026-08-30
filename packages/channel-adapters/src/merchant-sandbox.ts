import type { ProposedAction } from "@dueback/domain";
import type { ActionReceipt, ClosedActionAdapter } from "@dueback/runtime/action-broker";

export interface MerchantSandboxAdapterConfig {
  readonly baseUrl: string;
  readonly scenario: string;
  readonly actionSecret?: string;
  readonly fetch?: typeof globalThis.fetch;
}

export class MerchantSandboxAdapter implements ClosedActionAdapter {
  private readonly request: typeof globalThis.fetch;

  constructor(private readonly config: MerchantSandboxAdapterConfig) {
    this.request = config.fetch ?? globalThis.fetch;
  }

  async execute(
    proposal: ProposedAction,
    idempotencyKey: string,
    context: { readonly caseId: string; readonly correlationId?: string }
  ): Promise<ActionReceipt> {
    const response = await this.request(`${this.config.baseUrl}/v1/follow-ups`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": idempotencyKey,
        "x-dueback-scenario": this.config.scenario,
        ...(context.correlationId ? { "x-dueback-correlation-id": context.correlationId } : {}),
        ...(this.config.actionSecret ? { authorization: `Bearer ${this.config.actionSecret}` } : {})
      },
      body: JSON.stringify({ caseId: context.caseId, proposal })
    });
    if (!response.ok) throw new Error(`MERCHANT_SANDBOX_${String(response.status)}`);
    const receipt = (await response.json()) as ActionReceipt;
    if (!receipt.receiptId || !receipt.acceptedAt) throw new Error("INVALID_MERCHANT_RECEIPT");
    return receipt;
  }
}
