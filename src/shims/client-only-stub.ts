// Server stand-in for browser-only libraries (see next.config.ts). These
// libraries load only inside effects (dynamic `import()` in the browser), so
// server code never runs them. Without this stub Turbopack still bundles them
// into the server chunks, which made the Cloudflare Worker upload ~18 MB.
const stub = {};
export default stub;
