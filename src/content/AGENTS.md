# src/content: content packs

Data only. One folder per story (`bark-to-cloth/`), exported as a validated
`ContentPack` (`loadContentPack` throws on any broken reference).

- Never invent cultural content, words, quotations or provenance. New claims
  need a source, a locator and review (see docs/RESEARCH.md, PROJECT.md).
- Text that only navigates (owl lines, stamp descriptions, UI labels) may be
  written here; it must not state cultural facts.
- Positions use the units in `src/contracts/space.ts`. Mark design guesses
  with `placeholder: true`.
- Ids are stable. Renaming an id breaks stored journals and other parts.
- `npm test` validates the pack.
