// Small outdoor scenes for the island's four themed areas, with one sketch
// object and two quizzes each. Every fact comes from a claim in
// "land-and-sea" (Hokkaido Museum theme 2 and theme 4 panels, research
// preview). Quiz explanations only restate those claims; wrong options are
// plain distractors, not claims. Sets: src/parts/detail-scene/room/AreaSets.tsx.
import type {
  ActivityInput,
  ArtifactInput,
  DetailSceneInput,
} from "@/contracts";

const K = "land-and-sea";

const sketch = (builder: string) => ({
  representation: "illustrative" as const,
  license: "MIT (original)",
  rights: "approved" as const,
  consent: "not-required" as const,
  attribution: "Living Hokkaido team, original sketch geometry",
  assetId: `${builder}-sketch`,
  source: { kind: "procedural" as const, builder },
});

const aboutModel = (position: [number, number, number], node: string) => ({
  id: "about-model",
  position,
  normal: [0, 0.8, 0.6] as [number, number, number],
  node,
  title: "About this model",
  claimId: "area-sketch",
  kind: "disclaimer" as const,
});

export const areaArtifacts: ArtifactInput[] = [
  {
    id: "herring",
    knowledgeId: K,
    title: "A basket of herring",
    label: "Gifts of the sea",
    summaryClaimId: "sea-bounty",
    claimIds: [
      "sea-bounty",
      "sea-nets",
      "sea-products",
      "sea-catch-ainu",
      "area-sketch",
    ],
    model: { ...sketch("herring"), nodes: ["basket", "rim"] },
    display: { restRotation: [0.35, 0, 0], inspectScale: 1.6, pitchLimit: 0.8 },
    hotspots: [
      {
        id: "catch",
        position: [0, 0.12, 0.05],
        normal: [0, 1, 0.2],
        node: "basket",
        title: "What the catch became",
        claimId: "sea-products",
        kind: "claim",
      },
      aboutModel([0.27, 0.14, 0], "rim"),
    ],
    activityIds: ["place-herring-yard", "quiz-sea-products", "quiz-sea-catch"],
  },
  {
    id: "survey-stake",
    knowledgeId: K,
    title: "A survey stake",
    label: "A straight line through the forest",
    summaryClaimId: "survey-1890",
    claimIds: ["survey-1890", "survey-purpose", "survey-ainu", "area-sketch"],
    model: { ...sketch("survey-stake"), nodes: ["post", "tag", "line"] },
    display: { restRotation: [0, 0.4, 0], inspectScale: 1, pitchLimit: 0.5 },
    hotspots: [
      {
        id: "plots",
        position: [0.08, 0.78, 0.04],
        normal: [0, 0, 1],
        node: "tag",
        title: "Why straight plots?",
        claimId: "survey-purpose",
        kind: "claim",
      },
      {
        id: "guides",
        position: [0, 0.4, 0.04],
        normal: [0, 0, 1],
        node: "post",
        title: "Who guided the survey?",
        claimId: "survey-ainu",
        kind: "claim",
      },
      aboutModel([0, 0.04, 0.17], "mound"),
    ],
    activityIds: [
      "place-survey-camp",
      "quiz-survey-purpose",
      "quiz-survey-guides",
    ],
  },
  {
    id: "set-bow",
    knowledgeId: K,
    title: "A set bow",
    label: "Waiting on an animal path",
    summaryClaimId: "set-bow",
    claimIds: ["set-bow", "hunt-animals", "bear-use", "area-sketch"],
    model: {
      ...sketch("set-bow"),
      nodes: ["bow", "arrow", "trip-cord", "path"],
    },
    display: { restRotation: [0.4, -0.5, 0], inspectScale: 1, pitchLimit: 0.8 },
    hotspots: [
      {
        id: "cord",
        position: [0.62, 0.1, 0.2],
        normal: [0, 1, 0.3],
        node: "trip-cord",
        title: "The string on the path",
        claimId: "set-bow",
        kind: "claim",
      },
      {
        id: "animals",
        position: [0.7, 0.01, -0.35],
        normal: [0, 1, 0],
        node: "path",
        title: "Which animals?",
        claimId: "hunt-animals",
        kind: "claim",
      },
      aboutModel([-0.42, 0.3, 0], "stake"),
    ],
    activityIds: ["quiz-bear-use", "quiz-deer-kamuy"],
  },
  {
    id: "coal",
    knowledgeId: K,
    title: "A lump of coal",
    label: "From under the mountains",
    summaryClaimId: "coal-deposits",
    claimIds: [
      "coal-deposits",
      "coal-producer",
      "winter-logging",
      "area-sketch",
    ],
    model: { ...sketch("coal"), nodes: ["lump", "chip"] },
    display: { restRotation: [0.3, 0.5, 0], inspectScale: 2.2, pitchLimit: 1 },
    hotspots: [
      {
        id: "top-producer",
        position: [0, 0.18, 0.08],
        normal: [0, 0.8, 0.6],
        node: "lump",
        title: "One of Japan's top producers",
        claimId: "coal-producer",
        kind: "claim",
      },
      aboutModel([0.15, 0.07, 0.05], "chip"),
    ],
    activityIds: [
      "place-mine-forest",
      "quiz-coal-producer",
      "quiz-winter-logging",
    ],
  },
];

const quiz = (
  id: string,
  artifactId: string,
  claimIds: string[],
  title: string,
  question: string,
  options: string[],
  explanation: string,
): ActivityInput => ({
  kind: "quiz",
  id,
  knowledgeId: K,
  title,
  claimIds,
  artifactId,
  question,
  options,
  answer: 0,
  explanation,
});

export const areaActivities: ActivityInput[] = [
  quiz(
    "quiz-sea-products",
    "herring",
    ["sea-products", "sea-nets"],
    "What became of the catch?",
    "What was the catch made into, says the museum panel?",
    [
      "Dried and canned foods, and even fertiliser for fields",
      "Only fresh fish, sold the same day",
      "Lamp oil for the lighthouses",
    ],
    "The catch was made into dried and canned foods that keep for a long time, and even into fertiliser for fields and rice paddies. Fishers cast large nets in bays, and many boats went to the distant northern seas.",
  ),
  quiz(
    "quiz-sea-catch",
    "herring",
    ["sea-catch-ainu", "river-catch-ainu"],
    "From the sea and the rivers",
    "Which of these did Ainu people catch in the sea?",
    [
      "Cod, herring, fur seals, scallops and kombu",
      "Only salmon",
      "Nothing: they fished only in lakes",
    ],
    "In the sea, Ainu people caught fish such as cod, flounder, herring and swordfish, sea mammals such as fur seals, shellfish such as scallops and surf clams, and seaweeds such as kombu and wakame. In the rivers they caught salmon, trout, itou and shishamo.",
  ),
  quiz(
    "quiz-survey-purpose",
    "survey-stake",
    ["survey-purpose", "survey-1890"],
    "Why a straight line?",
    "Why did the 1890 survey team cut the land into straight plots?",
    [
      "So that land fit for farming could be cleared by plan",
      "To mark out hunting grounds",
      "To lay a railway line",
    ],
    "A survey team sent by the Hokkaido government studied the climate, soil, plants and animals. Land fit for farming was chosen in advance and cut into plots, so that clearing could go by plan.",
  ),
  quiz(
    "quiz-survey-guides",
    "survey-stake",
    ["survey-ainu"],
    "Who knew the way?",
    "Who was among the people hired to guide the survey and carry its loads?",
    ["Ainu people", "Only soldiers", "No one: the team went alone"],
    "The museum panel says that among the people hired to guide the survey and to carry its loads were Ainu people.",
  ),
  quiz(
    "quiz-bear-use",
    "set-bow",
    ["bear-use", "hunt-animals"],
    "Nothing wasted",
    "What became of the pelt of a brown bear?",
    [
      "Household goods or trade goods",
      "It was always thrown away",
      "It was only used for shoes",
    ],
    "Nothing was wasted: the meat and fat of a brown bear became food, and the pelt became household goods or trade goods.",
  ),
  quiz(
    "quiz-deer-kamuy",
    "set-bow",
    ["deer-not-kamuy", "bear-wolf-kamuy"],
    "Is every animal a kamuy?",
    "Is every animal a kamuy?",
    [
      "No. In many parts of Hokkaido, traditions say the deer is not a kamuy",
      "Yes, every animal is a kamuy",
      "No animal is ever a kamuy",
    ],
    "Not every animal is a kamuy: traditions in which the deer is not a kamuy are known in many parts of Hokkaido. The brown bear and the wolf, now extinct, were important kamuy in many regions.",
  ),
  quiz(
    "quiz-coal-producer",
    "coal",
    ["coal-producer", "coal-deposits"],
    "Coal for the country",
    "Hokkaido became one of Japan's top coal producers, together with which region?",
    ["Kitakyushu", "Okinawa", "Tokyo"],
    "Hokkaido became, with Kitakyushu, one of Japan's top coal producers. Coal mining began in earnest around the end of the 19th century, employed many people, and several towns were built.",
  ),
  quiz(
    "quiz-winter-logging",
    "coal",
    ["winter-logging"],
    "Winter in the woods",
    "In winter, how did people haul the wood they cut in the forests?",
    ["On horse-drawn sleighs", "On trucks", "They did not cut wood in winter"],
    "In winter, many people worked in the woods, felling trees with large saws and hauling the wood on horse-drawn sleighs.",
  ),
];

const outdoor = {
  entry: "fly-in" as const,
  bounds: { width: 8, depth: 7, height: 4 },
};

export const areaScenes: DetailSceneInput[] = [
  {
    id: "herring-coast",
    locationId: "herring-coast",
    knowledgeId: K,
    title: "Herring coast",
    setting: "area-coast",
    ...outdoor,
    views: {
      outside: { eye: [2, 15, 15], target: [0, 0, -1] },
      home: { eye: [3.2, 4.6, 6.6], target: [0, 0.6, -1.2] },
    },
    placements: [
      {
        artifactId: "herring",
        position: [0.9, 0.42, -0.6],
        rotationY: 0.2,
        focusView: { eye: [1.6, 1.6, 0.9], target: [0.9, 0.5, -0.6] },
        key: 1,
      },
    ],
    activityIds: ["place-herring-yard", "quiz-sea-products", "quiz-sea-catch"],
  },
  {
    id: "survey-forest",
    locationId: "survey-forest",
    knowledgeId: K,
    title: "Survey forest",
    setting: "area-forest",
    ...outdoor,
    views: {
      outside: { eye: [-2, 15, 15], target: [0, 0, -0.5] },
      home: { eye: [2.8, 4.4, 6.6], target: [0, 0.6, -0.8] },
    },
    placements: [
      {
        artifactId: "survey-stake",
        position: [-0.4, 0, 0.7],
        rotationY: 0.3,
        focusView: { eye: [0.4, 1.3, 2.4], target: [-0.4, 0.5, 0.7] },
        key: 1,
      },
    ],
    activityIds: [
      "place-survey-camp",
      "quiz-survey-purpose",
      "quiz-survey-guides",
    ],
  },
  {
    id: "animal-hills",
    locationId: "animal-hills",
    knowledgeId: K,
    title: "Animal hills",
    setting: "area-hills",
    ...outdoor,
    views: {
      outside: { eye: [2, 15, 15], target: [0, 0, -0.5] },
      home: { eye: [3, 4.4, 6.6], target: [0, 0.6, -1] },
    },
    placements: [
      {
        artifactId: "set-bow",
        position: [0.2, 0, 0.6],
        rotationY: 0,
        focusView: { eye: [0.9, 1.4, 2.3], target: [0.3, 0.2, 0.6] },
        key: 1,
      },
    ],
    activityIds: ["quiz-bear-use", "quiz-deer-kamuy"],
  },
  {
    id: "coal-mountain",
    locationId: "coal-mountain",
    knowledgeId: K,
    title: "Coal mountain",
    setting: "area-mountains",
    ...outdoor,
    views: {
      outside: { eye: [-2, 15, 15], target: [0, 0, -1] },
      home: { eye: [3, 4.8, 7], target: [0, 0.8, -1.2] },
    },
    placements: [
      {
        artifactId: "coal",
        position: [0, 0.78, -0.6],
        rotationY: 0.4,
        focusView: { eye: [0.8, 1.7, 0.7], target: [0, 0.85, -0.6] },
        key: 1,
      },
    ],
    activityIds: [
      "place-mine-forest",
      "quiz-coal-producer",
      "quiz-winter-logging",
    ],
  },
];
