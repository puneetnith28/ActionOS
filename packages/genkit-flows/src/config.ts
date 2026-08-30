import { vertexAI } from "@genkit-ai/google-genai";
import { genkit } from "genkit";

export const ai = genkit({
  plugins: [vertexAI({ location: process.env.GOOGLE_CLOUD_LOCATION ?? "global" })]
});

export const primaryModel = vertexAI.model("gemini-3.5-flash");
export const fallbackModel = vertexAI.model("gemini-1.5-pro");
