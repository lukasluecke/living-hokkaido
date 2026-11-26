import type { NextConfig } from "next";

// Browser-only libraries (WASM physics, splat renderer, game engine). They
// load only in the browser through dynamic `import()` inside effects, but
// Turbopack still bundles them into the server chunks. On the server they
// resolve to an empty stub, which keeps the Cloudflare Worker small.
const clientOnlyStub = "./src/shims/client-only-stub.ts";


const config: NextConfig = {
  turbopack: {
    root: process.cwd(),
    resolveAlias: {
      // Vendored games (vendor/README.md): give `import Phaser from "phaser"`
      // a default export (see src/shims/phaser.ts).
      phaser: { browser: "./src/shims/phaser.ts", default: clientOnlyStub },
      "@dimforge/rapier3d-compat": {
        browser: "./node_modules/@dimforge/rapier3d-compat/dist/rapier.mjs",
        default: clientOnlyStub,
      },
      "@sparkjsdev/spark": {
        browser: "./node_modules/@sparkjsdev/spark/dist/spark.module.js",
        default: clientOnlyStub,
      },
    },
  },
};
export default config;
