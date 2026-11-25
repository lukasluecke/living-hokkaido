// Bundler shim for the vendored Out of Place game (vendor/out-of-place).
// The game writes `import Phaser from "phaser"`, but Phaser's ESM build has
// only named exports, so Turbopack finds no default export. next.config.ts
// points the bare "phaser" import here; this re-exports the ESM build as a
// default (and as named exports). Types come from the phaser package.
import * as Phaser from "phaser/dist/phaser.esm.min.js";

export * from "phaser/dist/phaser.esm.min.js";
export default Phaser;
