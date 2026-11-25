# Lab hand-back

Every experiment ends with a `HANDBACK.md` in its lab folder
(`labs/<part>/HANDBACK.md`, or `labs/<part>-<name>/HANDBACK.md` for a second
experiment on the same part). The integrator reads this file first. It is
short and honest. Copy the template below.

## Lab naming

* One folder per experiment: `labs/<part>` or `labs/<part>-<topic>`, where
  `<part>` is one of `island`, `detail-scene`, `artifacts`, `activities`,
  `journal`, `reveal` (for example `labs/island-toon`, `labs/journal-book`).
* Branch: whatever your tool gives you, but put the part name in the PR title:
  `[lab:island] Toon terrain test`.
* A lab is a standalone Vite app with its own `package.json` and lockfile. Use
  the same three / R3F / drei / zod major versions as the root `package.json`.
* Import shared types and schemas with `@/contracts` (set the alias as in
  `labs/island/vite.config.ts` and `tsconfig.json`). Use content from
  `@/content` when you can, so ids already match.

## Template

```md
# Hand-back: <lab name>

Part: <island | detail-scene | artifacts | activities | journal | reveal>
Author: <name> (+ agent)   Date: <YYYY-MM-DD>
Status: <exploring | ready to integrate | dead end>

## Recommendation (3–5 lines)
What should the real app do, and why.

## Keep
| What | Files | Notes for porting |
|---|---|---|
| Camera director | src/Director.tsx | uses camera-controls; reads scene.views |

## Drop
What did not work and why (so nobody repeats it).

## Contract impact
- Uses as-is: <schemas/events/props used>
- Proposed changes: <additive field / new event / new activity kind>, with the
  reason. Put the exact diff in `contract-proposal.ts` next to this file.

## Assets
| File | Source | Licence / rights | Size | Triangles |
|---|---|---|---|---|

## Measurements
Device, draw calls, triangles, fps (real GPU only), download size.

## Fallback and accessibility
Keyboard path, reduced motion, no-WebGL behaviour.

## Screenshots
`shots/*.jpg` (small, max ~300 KB each).

## Open questions
```

## What not to commit in a lab

`node_modules`, build output, raw scans or captures without rights, personal
recordings, museum media, API keys. Large generated files stay out of Git
unless they are small and needed to run the lab.
