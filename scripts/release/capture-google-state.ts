import { chmod, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";

const baseUrl = process.env.ACTIONOS_DEPLOYED_URL ?? "https://bulbasour-503317.web.app";
const authDirectory = resolve(".auth");
const outputPath = resolve(process.env.ACTIONOS_AUTH_STATE ?? ".auth/google-owner.json");
if (!outputPath.startsWith(`${authDirectory}/`)) throw new Error("AUTH_STATE_PATH_MUST_BE_INSIDE_DOT_AUTH");
await mkdir(authDirectory, { recursive: true, mode: 0o700 });

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();
try {
  await page.goto(`${baseUrl}/cases`);
  process.stdout.write(
    "In the opened ActionOS window, select Sign in with Google and complete Google sign-in. " +
      "Leave the window open afterward. This command never reads your password.\n"
  );
  await page.getByText(/Signed in as /).waitFor({ state: "visible", timeout: 5 * 60_000 });
  await context.storageState({ path: outputPath, indexedDB: true });
  await chmod(outputPath, 0o600);
  process.stdout.write(`Authenticated browser state saved to ${outputPath}. Keep it private and delete it after the release tests.\n`);
} finally {
  await browser.close();
}
