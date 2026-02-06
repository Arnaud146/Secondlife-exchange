import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    globals: true,
    clearMocks: true,
  },
  resolve: {
    alias: {
      "@secondlife/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
      "@secondlife/shared/*": path.resolve(__dirname, "../../packages/shared/src/*"),
    },
  },
});
