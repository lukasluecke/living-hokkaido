// Vendored Vite games (vendor/*) read `import.meta.env?.DEV`. Next has no
// `import.meta.env`, so it is optional here and is undefined at run time.
interface ImportMeta {
  readonly env?: { readonly DEV?: boolean };
}

// The minified ESM build of Phaser, used by src/shims/phaser.ts.
declare module "phaser/dist/phaser.esm.min.js" {
  export * from "phaser";
}
