// Runs a TS module through Vite's SSR loader, so "@/..." and the root app's
// CommonJS-typed src/ load as ESM. Usage: node scripts/run.mjs scripts/schema-check.ts
import { createServer } from "vite";
const server = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "error" });
try {
  await server.ssrLoadModule(process.argv[2]);
} catch (e) {
  console.error(e);
  process.exitCode = 1;
} finally {
  await server.close();
}
