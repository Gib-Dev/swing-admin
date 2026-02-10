import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
      exclude: ["src/lib/db/schema.ts", "src/lib/db/seed.ts"],
    },
  },
});
