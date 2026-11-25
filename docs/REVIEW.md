# Review pass (later)

Lukas, 2026-11-25: for the prototype, review gates are open. These items need
a qualified review before anything is presented as approved. Add your part's
items under its own heading.

## Curator voice memories

- [ ] `src/content/bark-to-cloth/memories.ts`: the sample memory is team text
      with no real curator or recording (`placeholder: true`). Replace it with
      a real curator memory and a real consent record, or remove it.
- [ ] Ainu content: the schema and `translationGate` no longer block machine
      translation of Ainu (`lang: "ain"` or `containsAinu`). `needsReview`
      shows a "Draft" label instead. Decide with a qualified reviewer whether
      to restore the block (see git history of `src/contracts/memory.ts` and
      `src/domain/voice-memory.ts`).
- [ ] Check every machine translation (`mode: "machine"`) and set
      `mode: "human-checked"` with `checkedBy` only for a real, named person.
- [ ] Device voice placeholder ("Read aloud") on text-only memories: keep or
      remove. It never reads Ainu.
- [ ] Kept on purpose (not part of the open gates): voice-clone consent,
      translation consent for real speakers, withdrawal hides the memory.
