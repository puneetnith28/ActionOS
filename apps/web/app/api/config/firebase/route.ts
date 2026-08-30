import { config } from "../../../../lib/config";

export const runtime = "nodejs";

export function GET() {
  let firebase;
  try {
    firebase = config.firebase;
  } catch (error) {
    return Response.json({ error: "PUBLIC_FIREBASE_CONFIG_UNAVAILABLE" }, { status: 503 });
  }
  return Response.json({ ...firebase, projectId: config.projectId });
}
