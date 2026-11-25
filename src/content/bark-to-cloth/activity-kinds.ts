// Story, words and trace activities (prototypes: labs/activities-kinds).
// Every "fact" line restates a bark-to-cloth claim; "frame" lines only guide.
// The words activity uses English stand-ins: no Ainu word is shown until a
// qualified reviewer and a consenting speaker's recording exist
// (docs/RESEARCH.md). Renderers: src/parts/activities/kinds.
import type { ActivityInput } from "@/contracts";

const story = {
  kind: "story",
  id: "story-bark-to-cloth",
  knowledgeId: "bark-to-cloth",
  title: "From bark to cloth, retold",
  claimIds: ["bark-fiber", "variation", "illustrative", "editorial-policy"],
  artifactId: "garment",
  narrator: {
    character: "owl",
    credit: "Read by the owl guide · a fictional character",
    voice: { kind: "device-voice-placeholder" },
  },
  chapters: [
    {
      id: "material",
      title: "A material",
      lines: [
        {
          id: "m1",
          role: "frame",
          text: "This research preview follows a material into a garment.",
        },
        {
          id: "m2",
          role: "fact",
          text: "The Hokkaido Digital Museum describes cloth woven from inner bark fibers.",
          claimIds: ["bark-fiber"],
        },
      ],
      pause: {
        prompt: "What next?",
        choices: [
          { id: "go-on", label: "Keep listening", action: { to: "continue" } },
          {
            id: "how",
            label: "How do we know?",
            action: { to: "reveal", claimId: "bark-fiber" },
          },
          {
            id: "skip",
            label: "Skip to the last chapter",
            action: { to: "chapter", chapterId: "knowing" },
          },
        ],
      },
    },
    {
      id: "many",
      title: "More than one story",
      lines: [
        {
          id: "v1",
          role: "fact",
          text: "Its account also highlights differences in clothing across regions and occasions.",
          claimIds: ["variation"],
        },
        {
          id: "v2",
          role: "fact",
          text: "Clothing varies by material, region and occasion.",
          claimIds: ["variation"],
        },
      ],
      pause: {
        prompt: "Pause and think: what can one object not tell you?",
        choices: [
          {
            id: "go-on-2",
            label: "Keep listening",
            action: { to: "continue" },
          },
          {
            id: "how-2",
            label: "How do we know?",
            action: { to: "reveal", claimId: "variation" },
          },
        ],
      },
    },
    {
      id: "knowing",
      title: "How we know",
      lines: [
        {
          id: "k1",
          role: "frame",
          text: "Look closely, follow the source, and consider what a material can tell us.",
        },
        {
          id: "k2",
          role: "fact",
          text: "These simple shapes are learning placeholders, not museum objects.",
          claimIds: ["illustrative"],
        },
        {
          id: "k3",
          role: "fact",
          text: "Before anything is shared, we check consent, provenance and accuracy.",
          claimIds: ["editorial-policy"],
        },
      ],
    },
  ],
  completion:
    "The museum describes cloth woven from inner bark fibers, and clothing that varies by material, region and occasion.",
} satisfies ActivityInput;

const unreviewed = {
  spelling: false,
  region: false,
  meaning: false,
  pronunciation: false,
  consent: false,
};

const words = {
  kind: "words",
  id: "words-objects",
  knowledgeId: "bark-to-cloth",
  title: "Words for things",
  claimIds: ["bark-fiber", "variation"],
  lang: "ain",
  standIn: true,
  prompt: "Listen, say it aloud, then match each word to its object.",
  steps: ["listen", "repeat", "match"],
  terms: [
    {
      id: "fiber",
      text: "fiber",
      lang: "en",
      gloss: "inner bark fibers",
      artifactId: "fiber",
      claimId: "bark-fiber",
      audio: { kind: "device-voice-placeholder" },
      review: unreviewed,
    },
    {
      id: "cloth",
      text: "cloth",
      lang: "en",
      gloss: "cloth woven from those fibers",
      artifactId: "cloth",
      claimId: "bark-fiber",
      audio: { kind: "device-voice-placeholder" },
      review: unreviewed,
    },
    {
      id: "garment",
      text: "garment",
      lang: "en",
      gloss: "clothing, which varies by region and occasion",
      artifactId: "garment",
      claimId: "variation",
      audio: { kind: "device-voice-placeholder" },
      review: unreviewed,
    },
  ],
} satisfies ActivityInput;

const trace = {
  kind: "trace",
  id: "trace-sources",
  knowledgeId: "bark-to-cloth",
  title: "Follow the thread",
  claimIds: ["bark-fiber", "variation", "illustrative", "editorial-policy"],
  prompt:
    "Every sentence in this place comes from somewhere. Pick a sentence, then the source that backs it.",
  completion:
    "Each sentence now has its thread. This is still a research preview: no reviewer has approved it yet.",
} satisfies ActivityInput;

export const activityKinds: ActivityInput[] = [story, words, trace];
