import { defineConfig } from "vitest/config";

export default defineConfig({
  // three and Rapier (WASM inlined in the -compat build) are lazy chunks,
  // loaded only when the game mounts.
  build: { chunkSizeWarningLimit: 2600 },
  server: { port: 5174, strictPort: true, host: true },
  // Physics tests simulate whole runs; give them room when the machine is
  // busy (a browser open alongside made 5 s too tight).
  test: { include: ["src/**/*.test.ts"], testTimeout: 20_000 },
});
