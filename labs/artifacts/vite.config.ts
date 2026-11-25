import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// "@/..." resolves to the main app's src/, so the lab uses the shared
// contracts (@/contracts) and content (@/content). Run `npm ci` at the repo
// root once so zod resolves for those files.
const appSrc = fileURLToPath(new URL("../../src", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": appSrc } },
  server: { port: 5199, fs: { allow: [".", appSrc] } },
});
