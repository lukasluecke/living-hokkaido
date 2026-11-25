# Living Hokkaido

A source-led cultural learning prototype: an owl-guided 3D landscape, one textile room, three interactive objects, narrated research preview, three reflections and a Heritage Journal. A contributor can stage a source, edit a mock extraction, review a proposed activity and approve it into the same visitor session.

## Run

Node 20.9+ (Node 22 LTS recommended), npm.

```sh
npm ci
npm run dev
# http://localhost:3000
```

No accounts, API keys or paid services are required. `npm run build && npm start` runs the production build. `npm run typecheck`, `npm run lint`, and `npm test` are independent checks. Biome formats; Oxlint checks TypeScript. Commit `package-lock.json`.

## Try the vertical slice

1. Follow the owl into the textile room. Drag to orbit; scroll to zoom. Equivalent HTML object buttons support keyboard users and devices without WebGL.
2. Inspect the three illustrative objects, read their source notes, play synthetic device narration, answer three questions, and open the journal. Correct answers persist on this device; reset is available.
3. Open Contribute a story. Use a harmless `.txt` sample such as: “This is an original demonstration note about a blue sample cloth.” Name its source. Create a structured draft, edit it, propose an activity, enter a reviewer and complete all checks.
4. Approve the local preview, return to the room, and find the contribution below the research activities. Withdraw it from the contributor studio to remove it. Reload clears contributions; journal progress remains.

## Honest scope

The seed story is a **research preview awaiting cultural/editorial approval**, not a published museum collection. Geometry is original illustrative material, not an authentic artifact or scanned room. No Ainu pronunciation, cloned voices, personal recordings or museum assets are bundled. Ainu is a distinct language, not a Japanese dialect.

Source files are never uploaded to a server. Plain text is read in the browser; audio, images and PDFs are staged by filename and need manually supplied text. Mock extraction retains supplied text; it does not verify facts. Drafts live in component memory. The reviewer name is a demonstration field, not authentication. Do not use this scaffold as a production repository of sensitive contributions.

All sponsor adapters are mock/unavailable and labeled. Convex and Clerk are deliberately deferred until shared storage and authenticated review are required. There is no pretend deployed backend or trained model. Working on a part of the visitor experience? Start with [docs/PARTS.md](docs/PARTS.md) and [docs/STYLE.md](docs/STYLE.md); `/shell` shows all parts wired together. See [ARCHITECTURE.md](ARCHITECTURE.md), [PROJECT.md](PROJECT.md), [PLAN.md](PLAN.md), [team workstreams](docs/TEAM.md), [contracts](docs/CONTRACTS.md), [research](docs/RESEARCH.md) and [integration decisions](docs/INTEGRATIONS.md).

## License

Original code and original placeholder geometry: MIT, see LICENSE. External cultural sources retain their own rights; a link is not permission to redistribute them. Uploaded material is not automatically MIT-licensed. The original event PDFs and participant roster are intentionally excluded from this repository.
