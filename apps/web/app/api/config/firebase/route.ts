export const runtime = "nodejs";

export function GET() {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const appId = process.env.FIREBASE_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) {
    return Response.json({ error: "PUBLIC_FIREBASE_CONFIG_UNAVAILABLE" }, { status: 503 });
  }
  return Response.json({ apiKey, authDomain, projectId, appId });
}
