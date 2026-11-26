// The Omusha diorama (Hokkaido Museum, theme 1) as a Gaussian splat, from
// Shaw's xjets/sapporo-omusha (vendored with git subtree, vendor/README.md).
// From the vendored repo we take only data: the figure and region positions
// (src/hotspots.json) and the figure names (characters/1808/*.json). Shaw's
// observations and character sheets are drafts ("unverified", "TODO"), so
// no claim here comes from them. Every claim is a short paraphrase of the
// two museum panels (transcriptions/panels.md, 7835 and 7836), research
// preview. The museum's panel notes say this is a colonial power scene:
// look closer, no game, no score.
//
// The splat file itself is museum material. It is not in Git; the app loads
// it from the R2 bucket. Public without a password (Lukas, 2026-11-26:
// "skip the demo password"); written museum permission is still open
// (docs/REVIEW.md). Set `gated: true` to put it behind the password again.
import type { ActivityInput, KnowledgeEntry, Source, Vec3 } from "@/contracts";
import ainuChild from "@vendor/sapporo-omusha/characters/1808/ainu-child.json";
import ainuElder from "@vendor/sapporo-omusha/characters/1808/ainu-elder.json";
import ainuWoman from "@vendor/sapporo-omusha/characters/1808/ainu-woman.json";
import aizuOfficer from "@vendor/sapporo-omusha/characters/1808/aizu-officer.json";
import aizuSoldier from "@vendor/sapporo-omusha/characters/1808/aizu-soldier.json";
import elderBlackCrest from "@vendor/sapporo-omusha/characters/1808/elder-black-crest.json";
import elderBrushstrokes from "@vendor/sapporo-omusha/characters/1808/elder-brushstrokes.json";
import elderChrysanthemum from "@vendor/sapporo-omusha/characters/1808/elder-chrysanthemum.json";
import elderLeafSprigs from "@vendor/sapporo-omusha/characters/1808/elder-leaf-sprigs.json";
import elderMapleLeaves from "@vendor/sapporo-omusha/characters/1808/elder-maple-leaves.json";
import elderPinkFlowers from "@vendor/sapporo-omusha/characters/1808/elder-pink-flowers.json";
import elderStarFlowers from "@vendor/sapporo-omusha/characters/1808/elder-star-flowers.json";
import interpreter from "@vendor/sapporo-omusha/characters/1808/interpreter.json";
import hotspots from "@vendor/sapporo-omusha/src/hotspots.json";

const K = "omusha-diorama";

const panel = (id: string, title: string, photo: string): Source => ({
  id,
  title: `Hokkaido Museum: ${title}`,
  kind: "museum",
  rights: "unknown",
  consent: "pending",
  attribution: `Hokkaido Museum, permanent exhibition, theme 1 (Ezo trade period), ${photo}. Photographed 2026-11-25.`,
  placeholder: false,
});

const sources: Source[] = [
  panel(
    "hm-panel-omusha-diorama",
    "ジオラマの中をのぞいてみよう (Look inside the diorama)",
    "photo 7835",
  ),
  panel(
    "hm-panel-omusha-kushunkotan",
    "クシュンコタンで行われたオムシャ (The Omusha at Kushunkotan)",
    "photo 7836",
  ),
  {
    id: "sapporo-omusha-capture",
    title: "Omusha 1808 splat capture (Shaw, xjets/sapporo-omusha)",
    kind: "document",
    rights: "unknown",
    consent: "pending",
    attribution:
      "Gaussian splat of the Hokkaido Museum's Omusha diorama, captured by Shaw at Hack Hokkaido Build Week, November 2026. Code MIT; the capture is museum material and is not under the MIT license (NOTICE.md).",
    placeholder: false,
  },
];

const c = (id: string, text: string, ...cites: [string, string][]) => ({
  id,
  text,
  citations: cites.map(([sourceId, locator]) => ({ sourceId, locator })),
});

export const omushaKnowledge: KnowledgeEntry = {
  id: K,
  title: "The Omusha at Kushunkotan, 1808",
  subtitle: "A museum diorama, captured as a Gaussian splat",
  presentation: "research-preview",
  sources,
  claims: [
    c(
      "omusha-raids",
      "In 1806 and 1807, Russian ships attacked buildings and ships of the Wajin and Ainu houses and storehouses at Kushunkotan and on Etorofu. They took goods and burned the rest. After this, the shogunate ordered the Aizu domain to guard Sakhalin.",
      ["hm-panel-omusha-kushunkotan", "panel text, sentences 1–2 (photo 7836)"],
    ),
    c(
      "omusha-1808",
      "In 1808 the Aizu domain held an Omusha at Kushunkotan in Sakhalin. About 700 Aizu soldiers came, and the ceremony took place in a tense, unquiet atmosphere.",
      ["hm-panel-omusha-kushunkotan", "panel text, sentence 3 (photo 7836)"],
    ),
    c(
      "omusha-display",
      "Curtains with the Aizu hollyhock crest, guns, bows, armour and banners, and samurai seated in formal rows stage a show of military authority. The museum calls the scene very intimidating.",
      ["hm-panel-omusha-diorama", "paragraph 1, sentence 1 (photo 7835)"],
    ),
    c(
      "omusha-elders",
      "Seven village elders sit in a line in front of the building. The eldest, in the middle, wears a black haori. The others wear brightly coloured Japanese robes that the Wajin gave them.",
      ["hm-panel-omusha-diorama", "paragraph 1, sentences 2–4 (photo 7835)"],
    ),
    c(
      "omusha-goods",
      "Sake barrels, tobacco, sword guards and sword blades are placed in front of the elders.",
      [
        "hm-panel-omusha-diorama",
        "paragraph 2, sentence 1 and photo caption (photo 7835)",
      ],
    ),
    c(
      "omusha-interpreter",
      "An interpreter of the Ainu language sits in the central building. He reads out laws and rules, and after that the goods are handed out.",
      ["hm-panel-omusha-diorama", "paragraph 2, sentence 2 (photo 7835)"],
    ),
    c(
      "omusha-crowd",
      "Many Ainu people sit on the right, among piles of rice bales and sake barrels. These goods are handed out after the ceremony, and a feast follows.",
      ["hm-panel-omusha-diorama", "paragraph 2, sentences 3–4 (photo 7835)"],
    ),
    c(
      "omusha-capture",
      "This 3D view is a Gaussian splat that Shaw made from photos of the museum diorama. It records the diorama, not the place in 1808. Figures without a claim here are not described yet.",
      ["sapporo-omusha-capture", "README.md and NOTICE.md"],
    ),
  ],
};

type Sheet = { id: string; name: { en: string }; variant?: { en: string } };
const sheets: Sheet[] = [
  ainuChild,
  ainuElder,
  ainuWoman,
  aizuOfficer,
  aizuSoldier,
  elderBlackCrest,
  elderBrushstrokes,
  elderChrysanthemum,
  elderLeafSprigs,
  elderMapleLeaves,
  elderPinkFlowers,
  elderStarFlowers,
  interpreter,
];
const sheetById = new Map(sheets.map((s) => [s.id, s]));

/** Which claims a figure or region shows. Not listed: "not known yet". */
const figureClaims: Record<string, string[]> = {
  "elder-black-crest": ["omusha-elders", "omusha-goods"],
  "elder-brushstrokes": ["omusha-elders"],
  "elder-chrysanthemum": ["omusha-elders"],
  "elder-leaf-sprigs": ["omusha-elders"],
  "elder-maple-leaves": ["omusha-elders"],
  "elder-pink-flowers": ["omusha-elders"],
  "elder-star-flowers": ["omusha-elders"],
  interpreter: ["omusha-interpreter"],
  "aizu-soldier": ["omusha-display", "omusha-1808"],
  "aizu-officer": ["omusha-display"],
  "ainu-elder": ["omusha-crowd"],
  "ainu-woman": ["omusha-crowd"],
  "ainu-child": ["omusha-crowd"],
};

/** Visible names for Shaw's scene regions. They describe; no facts. */
const regionInfo: Record<string, { label: string; claimIds: string[] }> = {
  "diorama-hall": {
    label: "The central building",
    claimIds: ["omusha-interpreter"],
  },
  "diorama-curtains": {
    label: "Curtains with crests",
    claimIds: ["omusha-display"],
  },
  "diorama-troops": {
    label: "Soldiers in rows",
    claimIds: ["omusha-display", "omusha-1808"],
  },
  "diorama-bales": { label: "Rice bales", claimIds: ["omusha-crowd"] },
  "diorama-tubs": { label: "Barrels and goods", claimIds: ["omusha-goods"] },
};

const v3 = (p: number[]): Vec3 => [p[0] ?? 0, p[1] ?? 0, p[2] ?? 0];

const spots = [
  ...hotspots.hotspots.flatMap((h) => {
    const s = sheetById.get(h.character);
    if (!s) return [];
    return [
      {
        id: h.character,
        label: s.variant ? `${s.name.en} (${s.variant.en})` : s.name.en,
        group: "figure" as const,
        position: v3(h.position),
        claimIds: figureClaims[h.character] ?? [],
      },
    ];
  }),
  ...hotspots.regions.flatMap((r) => {
    const info = regionInfo[r.envelope];
    if (!info) return [];
    return [
      {
        id: r.envelope,
        label: info.label,
        group: "scene" as const,
        position: v3(r.position),
        claimIds: info.claimIds,
      },
    ];
  }),
];

export const omushaLook: ActivityInput = {
  kind: "splat-look",
  id: "omusha-look",
  knowledgeId: K,
  title: "The Omusha diorama, up close",
  claimIds: omushaKnowledge.claims.map((x) => x.id),
  prompt:
    "A diorama in the Hokkaido Museum shows an Omusha in Sakhalin. Turn the capture, zoom in, and open the figures and parts of the scene to read what the museum panels say about them.",
  completion:
    "You read every panel note: about 700 Aizu soldiers, a show of military authority, seven elders in robes the Wajin gave them, and laws read out through an interpreter before the goods were handed out.",
  asset: {
    key: "omusha.sog",
    label: "Capture of a museum diorama",
    gated: false,
    flip: true,
  },
  view: { eye: v3(hotspots.view.position), target: v3(hotspots.view.target) },
  spots,
};
