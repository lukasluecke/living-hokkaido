import type { NextConfig } from "next";

const config: NextConfig = {
  turbopack: {
    root: process.cwd(),
    // Vendored games (vendor/README.md): give `import Phaser from "phaser"`
    // a default export (see src/shims/phaser.ts).
    resolveAlias: { phaser: "./src/shims/phaser.ts" },
  },
};
export default config;
