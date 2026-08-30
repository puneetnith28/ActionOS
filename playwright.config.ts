import { defineConfig } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const privateTemp = resolve(".playwright-tmp");
mkdirSync(privateTemp, { recursive: true });
process.env.TMPDIR = privateTemp;

export default defineConfig({
  testDir: "tests/e2e",
  testMatch: [
    "deployed-demo.spec.ts",
    "deployed-ambiguous-review.spec.ts",
    "deployed-general-promise.spec.ts",
    "deployed-example-matrix.spec.ts",
    "deployed-managed-email.spec.ts",
    "channel-plan.spec.ts",
    "intake-resilience.spec.ts",
    "consumer-case-detail.spec.ts",
    "accessibility.spec.ts",
    "consumer-case-inbox.spec.ts",
    "cross-device-return.spec.ts"
  ],
  timeout: 90_000,
  retries: 0,
  use: {
    browserName: "chromium",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  }
});
