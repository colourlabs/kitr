import { playwrightLauncher } from "@web/test-runner-playwright";
import { esbuildPlugin } from "@web/dev-server-esbuild";

export default {
  files: "tests/**/*.wtr.test.ts",
  browsers: [playwrightLauncher({ product: "chromium" })],
  nodeResolve: true,
  plugins: [
    esbuildPlugin({
      ts: true,
      target: "es2022",
      tsconfig: "./tsconfig.json",
    }),
  ],
};
