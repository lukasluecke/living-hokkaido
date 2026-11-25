// Knowledge for the "From bark to cloth" research preview. Text comes from
// src/data/story.ts (the existing seed). Do not add claims here without a
// source and locator; see docs/RESEARCH.md.
import type { KnowledgeEntry, Source } from "@/contracts";
import { researchClaims, story } from "@/data/story";

const museum = (id: string): Source => {
  const s = story.sources.find((x) => x.id === id);
  if (!s) throw Error(`Missing seed source ${id}`);
  return {
    id: s.id,
    title: s.title,
    url: s.url,
    kind: "museum",
    rights: "unknown",
    consent: "pending",
    attribution: s.title,
    placeholder: false,
  };
};

const policy: Source = {
  id: "living-hokkaido-policy",
  title: "Living Hokkaido · editorial policy and asset notes",
  kind: "document",
  rights: "approved",
  consent: "granted",
  attribution:
    "Living Hokkaido team (PROJECT.md, public/models/ATTRIBUTION.md)",
  placeholder: false,
};

/** Placeholder audio source for the sample curator memory (memories.ts).
 *  No recording exists. Replace with a real, consented recording. */
const sampleMemoryAudio: Source = {
  id: "sample-memory-audio",
  title: "Sample curator memory · placeholder, no recording",
  kind: "audio",
  rights: "unknown",
  consent: "pending",
  attribution: "Living Hokkaido team (sample text, not a curator)",
  placeholder: true,
};

export const barkToCloth: KnowledgeEntry = {
  id: "bark-to-cloth",
  title: story.title,
  subtitle: story.subtitle,
  presentation: "research-preview",
  narration: story.narration,
  sources: [museum("hdm"), museum("nam"), policy, sampleMemoryAudio],
  claims: [
    ...researchClaims,
    {
      id: "illustrative",
      text: "Sketch geometry made for this demo. It is not a museum object, scan or reconstruction.",
      citations: [
        {
          sourceId: "living-hokkaido-policy",
          locator: "public/models/ATTRIBUTION.md",
        },
      ],
    },
    {
      id: "no-technique",
      text: "This grid invites close looking. It does not teach an authenticated weaving technique.",
      citations: [
        {
          sourceId: "living-hokkaido-policy",
          locator: "PROJECT.md / Principles",
        },
      ],
    },
  ],
};
