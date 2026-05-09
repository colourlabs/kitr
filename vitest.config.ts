import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "browser",
          environment: "happy-dom",
          include: ["tests/*.browser.test.ts"],
        },
      },
      {
        test: {
          name: "ssr",
          environment: "node",
          include: ["tests/*.ssr.test.ts"],
        },
      },
    ],
  },
});
