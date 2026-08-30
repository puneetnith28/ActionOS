import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts", "tests/**/*.test.ts", "tests/**/*.spec.ts"],
    exclude: [
      "tests/e2e/**/*.spec.ts",
      "tests/security/firestore-rules.test.ts"
    ],
    passWithNoTests: false,
    testTimeout: 10_000
  }
});
