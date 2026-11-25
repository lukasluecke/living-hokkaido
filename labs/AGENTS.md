# labs/: free experiments per part

Each folder is a standalone Vite app that explores one part
(`labs/<part>` or `labs/<part>-<topic>`). Labs are not built by
`npm run check`, so you can move fast. Integration happens later, by porting
ideas and code into `src/parts/<part>/` (see docs/PARTS.md).

Rules:

1. Stay inside your lab folder. Do not edit `src/` from a lab branch, except a
   contract proposal that you also describe in `HANDBACK.md`.
2. Use the shared contracts and content: `import … from "@/contracts"` and
   `"@/content"` (alias is set in each lab's `vite.config.ts` and
   `tsconfig.json`; run `npm ci` once at the repo root). Use the pack's ids
   (`lake-house`, `fiber`, `cloth`, `garment`, …) and units
   (`src/contracts/space.ts`).
3. Model your component on the part's props in `src/contracts/parts.ts` and
   report actions as `ExperienceEvent`s (log them, or use `createEventBus`).
   Then porting is mostly copy and wire.
4. Follow docs/STYLE.md. Do not invent cultural content. Label illustrative
   geometry. Record licences of every asset.
5. Keep `HANDBACK.md` current (template: docs/HANDBACK.md). It is the thing
   the integrator reads. Write measurements honestly (no fps from software
   rendering).
6. Same major versions as the root app: three 0.180, @react-three/fiber 9,
   drei 10, zod 4, React 19.

Existing labs: `island` (overworld), `detail-scene` (interior),
`artifacts` (objects and turn viewer).
