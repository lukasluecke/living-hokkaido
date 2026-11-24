import type { Activity } from "@/domain/contracts";
export const story = {
  id: "bark-to-cloth",
  title: "From bark to cloth",
  subtitle: "A small thread. A living connection.",
  status: "Research preview · cultural review pending",
  narration:
    "This research preview follows a material into a garment. The Hokkaido Digital Museum describes cloth woven from inner bark fibers. Its account also highlights differences in clothing across regions and occasions. Look closely, follow the source, and consider what a material can tell us. These simple shapes are learning placeholders, not museum objects.",
  sources: [
    {
      id: "hdm",
      title: "Hokkaido Digital Museum · Clothing",
      url: "https://hokkaido-digital-museum.jp/en/hokkaido/ainu/a-01/",
      locator: "Outline of Ainu clothing / Bark clothes",
    },
    {
      id: "nam",
      title: "National Ainu Museum · 3D exhibits",
      url: "https://nam-vm.jp/en/list/",
      locator: "Garment (bark fiber) [Attus/Ahrus]",
    },
  ],
  artifacts: [
    {
      id: "fiber",
      title: "A material",
      label: "Inner bark fibers",
      description:
        "The museum describes inner bark fibers used to weave cloth.",
      sourceId: "hdm",
      locator: "Bark clothes",
    },
    {
      id: "cloth",
      title: "A woven surface",
      label: "From fiber to cloth",
      description:
        "This abstract grid invites close observation. It does not teach an authenticated weaving technique.",
      sourceId: "hdm",
      locator: "Bark clothes; geometry is original illustrative material",
    },
    {
      id: "garment",
      title: "A garment",
      label: "More than one story",
      description:
        "The museum describes variation in clothing by region, material and occasion.",
      sourceId: "hdm",
      locator: "Outline of Ainu clothing",
    },
  ],
};
export const activities: Activity[] = [
  {
    id: "material",
    storyId: story.id,
    question: "Which material does the museum describe for bark cloth?",
    options: ["Inner bark fibers", "Glass fibers", "Metal wire"],
    answer: 0,
    explanation:
      "See the museum’s Bark clothes section. This is a reading activity, not craft instruction.",
    claimIds: ["bark-fiber"],
  },
  {
    id: "variation",
    storyId: story.id,
    question: "What should we remember when looking at a garment?",
    options: [
      "One garment represents everyone",
      "Region, material and occasion matter",
      "All garments have the same use",
    ],
    answer: 1,
    explanation:
      "The museum explicitly describes variation. A single object cannot stand for all Ainu experience.",
    claimIds: ["variation"],
  },
  {
    id: "care",
    storyId: story.id,
    question: "Before adding a practitioner’s story, what comes first?",
    options: [
      "Publish it immediately",
      "Invent missing details",
      "Check consent, provenance and accuracy",
    ],
    answer: 2,
    explanation:
      "This is Living Hokkaido’s editorial policy, not a claim about cultural tradition.",
    claimIds: ["editorial-policy"],
  },
];
export const destinations = [
  {
    id: "studio",
    title: "The textile room",
    detail: "Explore the research preview",
    open: true,
    position: [0, 0, 0],
  },
  {
    id: "voices",
    title: "Listening grove",
    detail: "Future oral histories · no recordings yet",
    open: false,
    position: [-3, 0, -2],
  },
  {
    id: "workshop",
    title: "Maker’s clearing",
    detail: "Future practitioner-led skills",
    open: false,
    position: [3, 0, -1],
  },
  {
    id: "archive",
    title: "Memory cabin",
    detail: "Future community collections",
    open: false,
    position: [1, 0, 3],
  },
] as const;

// Evidence graph for the research preview. No approval is implied.
export const researchClaims = [
  {
    id: "bark-fiber",
    text: "Inner bark fibers can be woven into cloth.",
    citations: [
      {
        sourceId: "hdm",
        locator: "Clothes made of plant fibers / Bark clothes",
      },
    ],
  },
  {
    id: "variation",
    text: "Clothing varies by material, region and occasion.",
    citations: [{ sourceId: "hdm", locator: "Outline of Ainu clothing" }],
  },
  {
    id: "editorial-policy",
    text: "Check consent, provenance and accuracy before sharing.",
    citations: [
      {
        sourceId: "living-hokkaido-policy",
        locator: "PROJECT.md / Principles",
      },
    ],
  },
];
