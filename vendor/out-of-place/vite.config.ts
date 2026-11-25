import { defineConfig } from "vitest/config";

export default defineConfig({
  // Phaser is one lazy chunk (~1.2 MB, ~320 KB gzip), loaded only when the game mounts.
  build: { chunkSizeWarningLimit: 1300 },
  server: { port: 5173, strictPort: true, host: true },
  test: { include: ["src/**/*.test.ts", "content/**/*.test.ts"] },
});
