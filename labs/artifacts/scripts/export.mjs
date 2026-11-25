// Build procedural objects in Node and export GLB (flat look), no browser needed.
globalThis.self = globalThis;
globalThis.FileReader = class {
  readAsArrayBuffer(b) { b.arrayBuffer().then((r) => { this.result = r; this.onloadend?.(); }); }
  readAsDataURL(b) { b.arrayBuffer().then((r) => { this.result = `data:${b.type};base64,${Buffer.from(r).toString("base64")}`; this.onloadend?.(); }); }
};
const { GLTFExporter } = await import("three/examples/jsm/exporters/GLTFExporter.js");
const { builders } = await import("../src/models.ts");
const { materialFor } = await import("../src/looks.ts");
const fs = await import("node:fs");
fs.mkdirSync("public/gen", { recursive: true });
for (const [id, build] of Object.entries(builders)) {
  const g = build();
  g.traverse((o) => { if (o.isMesh) o.material = materialFor("flat", o.userData.part); o.material && (o.material.name = o.userData.part); });
  const buf = await new GLTFExporter().parseAsync(g, { binary: true });
  fs.writeFileSync(`public/gen/${id}.flat.raw.glb`, Buffer.from(buf));
  console.log(id, buf.byteLength);
}
