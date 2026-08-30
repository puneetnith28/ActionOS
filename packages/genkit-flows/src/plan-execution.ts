import { vertexAI } from "@genkit-ai/google-genai";
import { genkit, z } from "genkit";
import { missionGoalSchema, type MissionGoal } from "@actionos/contracts";

export const decomposedPlanSchema = z.object({
  allowedActions: z.array(z.enum(["SEND_FOLLOW_UP", "CHECK_STATUS"])).min(1).max(2),
  evidenceRequirements: z.array(z.object({
    minimumStatus: z.enum([
      "PLANNED",
      "ACTION_ATTEMPTED",
      "SYSTEM_ACKNOWLEDGED",
      "OUTCOME_CONFIRMED",
      "STATE_VERIFIED"
    ]),
    maxAgeSeconds: z.number().int().positive()
  })).min(1),
  explanation: z.string().optional()
});

export type DecomposedPlan = z.infer<typeof decomposedPlanSchema>;

export interface PlanningModelGateway {
  generate(input: {
    readonly system: string;
    readonly prompt: string;
  }): Promise<DecomposedPlan | null>;
}

export const planningSystemInstruction = `You decompose a mission goal into a verifiable execution plan.
Select the minimum required actions to achieve the goal.
Define the evidence requirements necessary to confirm success.`;

export async function planExecutionWithGateway(
  gateway: PlanningModelGateway,
  unparsedInput: unknown
): Promise<DecomposedPlan> {
  const input = missionGoalSchema.parse(unparsedInput);
  
  const output = await gateway.generate({
    system: planningSystemInstruction,
    prompt: `Goal: ${input.goalType}\nPromisor: ${input.promisor.value}\nResult: ${input.result.value}`
  });
  
  if (!output) throw new Error("MODEL_OUTPUT_MISSING");
  return output;
}

const ai = genkit({
  plugins: [vertexAI({ location: process.env.GOOGLE_CLOUD_LOCATION ?? "global" })]
});

const gateway: PlanningModelGateway = {
  async generate(input) {
    const response = await ai.generate({
      model: vertexAI.model("gemini-3.5-flash"),
      system: input.system,
      prompt: input.prompt,
      output: { schema: decomposedPlanSchema },
      config: { temperature: 0 }
    });
    return response.output ?? null;
  }
};

export const planExecutionFlow = ai.defineFlow(
  {
    name: "planExecution",
    inputSchema: missionGoalSchema,
    outputSchema: decomposedPlanSchema
  },
  async (input) => planExecutionWithGateway(gateway, input)
);
