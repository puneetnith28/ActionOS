import { z } from "genkit";
import { ai, primaryModel, fallbackModel } from "./config";
import { resolutionPlanSchema, channelCapabilitySchema, executionHistoryEntrySchema, type ExecutionPlan, type ChannelCapability, type ExecutionHistoryEntry } from "@actionos/contracts";

export const selectActionInputSchema = z.object({
  plan: z.any(),
  availableCapabilities: z.any(),
  executionHistory: z.array(z.any()).optional()
});

export type SelectActionInput = z.infer<typeof selectActionInputSchema>;

export const selectedActionSchema = z.object({
  actionType: z.enum(["SEND_FOLLOW_UP", "CHECK_STATUS", "WAIT", "ESCALATE"]),
  channelType: z.enum(["CONTROLLED_SANDBOX", "MANAGED_EMAIL", "GMAIL_CONNECTED", "PARTNER_API"]).optional(),
  reasoning: z.string().min(1)
});

export type SelectedAction = z.infer<typeof selectedActionSchema>;

export interface ActionSelectionGateway {
  generate(input: {
    readonly system: string;
    readonly prompt: string;
  }): Promise<SelectedAction | null>;
}

export const actionSelectionSystemInstruction = `You select the next appropriate autonomous action for a mission based on its execution plan, the available system capabilities, and the execution history (if any).
Review the goal, allowed actions, available capabilities, and previous history to determine the most logical next step.
Return the actionType to perform next. If no capability can satisfy an allowed action, return WAIT or ESCALATE with reasoning.`;

export async function selectActionWithGateway(
  gateway: ActionSelectionGateway,
  unparsedInput: unknown
): Promise<SelectedAction> {
  const input = selectActionInputSchema.parse(unparsedInput);
  const plan = resolutionPlanSchema.parse(input.plan);
  const availableCapabilities: ChannelCapability[] = input.availableCapabilities.map((c: unknown) => channelCapabilitySchema.parse(c));
  
  const historyText = input.executionHistory && input.executionHistory.length > 0
    ? `\nExecution History:\n${input.executionHistory.map((h) => `- [${h.occurredAt}] ${h.eventType}: ${h.summary}`).join("\n")}`
    : "";

  const prompt = `Goal: ${plan.goal}
Allowed Actions: ${plan.allowedActions.join(", ")}
Available Capabilities: ${availableCapabilities.map(c => c.channelType + (c.canSend ? ' (Send)' : '')).join(", ")}${historyText}`;

  const output = await gateway.generate({
    system: actionSelectionSystemInstruction,
    prompt
  });
  
  if (!output) throw new Error("MODEL_OUTPUT_MISSING");
  
  // Validate that the chosen channel type is actually available if an active action is chosen
  if (["SEND_FOLLOW_UP", "CHECK_STATUS"].includes(output.actionType)) {
    if (!output.channelType) throw new Error("CHANNEL_TYPE_REQUIRED_FOR_ACTION");
    const capability = availableCapabilities.find(c => c.channelType === output.channelType);
    if (!capability || capability.status !== "AVAILABLE") {
      throw new Error("SELECTED_CHANNEL_UNAVAILABLE");
    }
  }
  
  return output;
}



const gateway: ActionSelectionGateway = {
  async generate(input) {
    let response;
    try {
      response = await ai.generate({
        model: primaryModel,
        system: input.system,
        prompt: input.prompt,
        output: { schema: selectedActionSchema },
        config: { temperature: 0 }
      });
    } catch (error) {
      response = await ai.generate({
        model: fallbackModel,
        system: input.system,
        prompt: input.prompt,
        output: { schema: selectedActionSchema },
        config: { temperature: 0 }
      });
    }
    return response.output ?? null;
  }
};

export const selectActionFlow = ai.defineFlow(
  {
    name: "selectAction",
    inputSchema: selectActionInputSchema,
    outputSchema: selectedActionSchema
  },
  async (input) => selectActionWithGateway(gateway, input)
);
