// Activities from the Hokkaido Museum visit (knowledge "hokkaido-museum"
// in museum.ts, and the postwar claims in over-time.ts). Every explanation
// restates the cited claims. Wrong quiz options are plain distractors; they
// state nothing as fact.
import type { ActivityInput } from "@/contracts";

export const museumActivities: ActivityInput[] = [
  {
    kind: "quiz",
    id: "quiz-small-kana",
    knowledgeId: "hokkaido-museum",
    title: "Say it without a vowel",
    claimIds: ["small-kana", "sap-sat-sak", "romanised-by-us"],
    question:
      "In the word サプ (sap), the プ is written small. What does the small letter tell you?",
    options: [
      "The syllable ends with no vowel: say sap, not sapu",
      "Say the syllable twice",
      "Say the syllable louder",
    ],
    answer: 0,
    explanation:
      "Small katakana mark a syllable that ends with no vowel. To say sap, stop with your lips closed, as just before 'po' in 'Sapporo'. The museum's examples: sap = come out (plural), sat = dry, sak = to lack, or summer.",
  },
  {
    kind: "quiz",
    id: "quiz-full-adult",
    knowledgeId: "hokkaido-museum",
    title: "Tools of a full adult",
    claimIds: ["full-adult", "tools-mixed"],
    question:
      "It is said that someone was seen as a full adult once they could make which tools?",
    options: [
      "The everyday mortar, pestle and winnow",
      "A sword and lacquer bowls",
      "A canoe and its pole",
    ],
    answer: 0,
    explanation:
      "The museum says that only someone who could make the everyday tools, such as the mortar, pestle and winnow, was seen as a full adult. Not every tool was self-made: treasures from trade, such as swords and lacquerware, were often passed down the generations.",
  },
  {
    kind: "quiz",
    id: "quiz-canoe",
    knowledgeId: "hokkaido-museum",
    title: "Steer the canoe",
    claimIds: ["canoe-pole", "canoe-kamuy"],
    question: "How is a dugout canoe steered down a river?",
    options: [
      "Standing at the bow or stern, with a pole about 3–4 m long",
      "Sitting in the middle, with a sail",
      "From the bank, with a long rope",
    ],
    answer: 0,
    explanation:
      "On a river, someone standing at the bow or stern steers with a pole about 3–4 m long. In deep water or on lakes, people paddle, sitting down. A canoe is an important kamuy, and people prayed to it for a safe trip before boarding.",
  },
  {
    kind: "quiz",
    id: "quiz-garden",
    knowledgeId: "hokkaido-museum",
    title: "What grows by the house?",
    claimIds: ["crops", "wild-plants"],
    question:
      "Which plants does the museum say were grown from very early times?",
    options: [
      "Japanese millet and foxtail millet",
      "Potatoes and daikon",
      "Tea and cotton",
    ],
    answer: 0,
    explanation:
      "Millets were grown from very early times; potatoes, soybeans, daikon and the root vegetable atane are recorded from the mid-Edo period. People also gathered wild garlic, acorns, sarunashi berries and lily starch.",
  },
  {
    kind: "quiz",
    id: "quiz-ainu-today",
    knowledgeId: "house-over-time",
    title: "Where do Ainu people live today?",
    claimIds: ["panel-population", "panel-live-together", "not-frozen"],
    question: "Where do most Ainu people live today?",
    options: [
      "Across Hokkaido and Japan, side by side with their neighbours",
      "In villages where only Ainu people live",
      "Only in museums and culture parks",
    ],
    answer: 0,
    explanation:
      "The Ainu population is said to be tens of thousands or more. Most live in Hokkaido, many in Tokyo, Osaka and other places, and there are no villages where only Ainu people live: they live side by side with other people in Japan.",
  },
  {
    kind: "sequence",
    id: "sequence-postwar",
    knowledgeId: "house-over-time",
    title: "After the war",
    claimIds: ["panel-postwar-unheard", "panel-ordinary-society"],
    prompt: "Put these events from the museum's 'today' wall in order.",
    steps: [
      {
        id: "upopoy",
        label: "Upopoy opens in Shiraoi (2020)",
        claimId: "upopoy",
      },
      {
        id: "association",
        label: "The Hokkaido Ainu Association is founded in Shizunai (1946)",
        claimId: "panel-association-1946",
      },
      {
        id: "recognition",
        label: "The Diet recognizes the Ainu as an indigenous people (2008)",
        claimId: "recognition",
      },
      {
        id: "cable-car",
        label:
          "A traditional house is moved up the Noboribetsu cable car (1961)",
        claimId: "panel-tourism-1961",
      },
      {
        id: "reclaiming",
        label:
          "Ainu people look again at their own culture and history (late 1960s)",
        claimId: "panel-reclaiming",
      },
      {
        id: "act-ends",
        label: "The 1899 Act is abolished (1997)",
        claimId: "rights-movement",
      },
    ],
    order: [
      "association",
      "cable-car",
      "reclaiming",
      "act-ends",
      "recognition",
      "upopoy",
    ],
    explanation:
      "After 1946 most demands were not met for a long time. From the late 1960s Ainu people took their history and culture into their own hands, and work continues toward an 'ordinary' society of equals.",
  },
];

const greet = (
  id: string,
  text: string,
  romanised: string,
  region: string,
  x: number,
  y: number,
  gloss = "a greeting when you meet someone",
) => ({
  id,
  text,
  romanised,
  lang: "ain",
  gloss,
  region,
  x,
  y,
  claimId: `greet-${id}`,
});

const part = (
  id: string,
  text: string,
  romanised: string,
  gloss: string,
  x: number,
  y: number,
) => ({ id, text, romanised, lang: "ain", gloss, x, y, claimId: "cise-plan" });

export const museumMaps: ActivityInput[] = [
  {
    kind: "map",
    id: "map-greetings",
    knowledgeId: "hokkaido-museum",
    title: "One hello, many places",
    claimIds: [
      "greet-regions",
      "greet-irankarapte",
      "greet-iankarapte",
      "greet-inankarapte",
      "greet-irankarahte",
      "greet-ikatay",
      "greet-issorore",
      "dialect-areas",
      "romanised-by-us",
      "map-sketch",
    ],
    figure: "hokkaido",
    mode: "explore",
    prompt:
      "People greet each other in different ways in different places. Open each place on the map to see how people there say hello.",
    spots: [
      greet(
        "irankarapte",
        "イランカラプテ",
        "irankarapte",
        "Western Hokkaido",
        0.31,
        0.72,
      ),
      greet(
        "iankarapte",
        "イアンカラプテ",
        "iankarapte",
        "Eastern Hidaka",
        0.55,
        0.8,
        "a greeting, for example between adults who meet on the road",
      ),
      greet(
        "ikatay",
        "イカタイ",
        "ikatay",
        "Eastern Hidaka to eastern Hokkaido",
        0.65,
        0.7,
        "'long time no see'; close friends also use it like 'hello'",
      ),
      greet(
        "issorore",
        "イッソロレ",
        "issorore",
        "Eastern Hidaka to eastern Hokkaido",
        0.72,
        0.63,
        "hello",
      ),
      greet(
        "inankarapte",
        "イナンカラプテ",
        "inankarapte",
        "Eastern Hokkaido",
        0.84,
        0.66,
      ),
      greet(
        "irankarahte",
        "イランカラハテ",
        "irankarahte",
        "Sakhalin",
        0.45,
        0.2,
      ),
    ],
    completion:
      "One greeting, many places: the museum lists different greetings for western Hokkaido, eastern Hidaka, eastern Hokkaido and Sakhalin. Ainu has dialects, and words differ even within one dialect.",
    placeholder: true,
  },
  {
    kind: "map",
    id: "map-cise-plan",
    knowledgeId: "hokkaido-museum",
    title: "Find your way around the house",
    claimIds: ["cise-plan", "cise-size", "romanised-by-us", "map-sketch"],
    figure: "cise-plan",
    mode: "match",
    prompt:
      "Kayano Shigeru's plan of a cise names each part of the house. Pick a word, then put it in its place.",
    spots: [
      part("apeoy", "アペオイ", "apeoy", "hearth", 0.58, 0.5),
      part(
        "apeetok",
        "アペエトク",
        "apeetok",
        "head seat, at the far end of the hearth",
        0.79,
        0.5,
      ),
      part(
        "siso",
        "シソ",
        "siso",
        "true seat, along one side of the hearth",
        0.58,
        0.75,
      ),
      part(
        "harkiso",
        "ハラキソ",
        "harkiso",
        "left seat, along the other side",
        0.58,
        0.25,
      ),
      part(
        "rorunpuyar",
        "ロルンプヤラ",
        "rorunpuyar",
        "window of the kamuy seat, in the far wall",
        0.96,
        0.5,
      ),
      part(
        "itomunpuyar",
        "イトムンプヤラ",
        "itomunpuyar",
        "window that takes in light",
        0.81,
        0.92,
      ),
      part(
        "cise-apa",
        "チセアパ",
        "cise apa",
        "door into the house",
        0.22,
        0.5,
      ),
      part("sem-apa", "セマパ", "sem apa", "entrance, from outside", 0.04, 0.5),
    ],
    completion:
      "These are the words of Kayano Shigeru's 1978 plan, in Saru usage. On his plan the house is about 9.6 m long, including the entrance room.",
    placeholder: true,
  },
];

const REFRAIN = { id: "", role: "refrain" as const };
const refrainLine = (id: string) => ({ ...REFRAIN, id });

export const owlStory: ActivityInput = {
  kind: "story",
  id: "story-owl",
  knowledgeId: "hokkaido-museum",
  title: "The owl and its refrain",
  claimIds: [
    "owl-kamuy",
    "kamuy-visit",
    "kamuy-differ",
    "sakehe",
    "owl-sakehe",
    "telling-varies",
    "green-pigeon",
    "romanised-by-us",
  ],
  narrator: {
    character: "owl",
    credit: "Read by the owl guide · a fictional character",
    voice: { kind: "device-voice-placeholder" },
  },
  refrain: {
    text: "トゥノヤケ レノヤケ クントゥムケ カムイムイケ カムイチカッポ フム フム",
    romanised: "tunoyake renoyake kuntumke kamuymuyke kamuychikappo hum hum",
    lang: "ain",
    credit:
      "sakehe of the owl story of Shizunai, told by Suteno Orita (Hokkaido Museum, Q020)",
    claimId: "owl-sakehe",
  },
  chapters: [
    {
      id: "watcher",
      title: "The owl of the village",
      lines: [
        {
          id: "w1",
          role: "frame",
          text: "Sit for a moment. This is a story about a story.",
        },
        {
          id: "w2",
          role: "fact",
          text: "In many regions, Blakiston's fish owl is a kamuy with the role of watching over the village, and it is highly respected.",
          claimIds: ["owl-kamuy"],
        },
        {
          id: "w3",
          role: "fact",
          text: "Kamuy are thought to live in their own world, and to visit the human world as animals, plants, tools, rain or wind.",
          claimIds: ["kamuy-visit"],
        },
        {
          id: "w4",
          role: "fact",
          text: "Which beings are kamuy, and which matter most, differs by region and by person.",
          claimIds: ["kamuy-differ"],
        },
      ],
      pause: {
        prompt: "What next?",
        choices: [
          { id: "go-on", label: "Keep listening", action: { to: "continue" } },
          {
            id: "how",
            label: "How do we know?",
            action: { to: "reveal", claimId: "owl-kamuy" },
          },
        ],
      },
    },
    {
      id: "refrain",
      title: "A song that comes back",
      lines: [
        {
          id: "r1",
          role: "fact",
          text: "A kamuy yukar, a song of the kamuy, has a word that comes back again and again: the sakehe. Some catch a kamuy's call or movement; many have no clear meaning.",
          claimIds: ["sakehe"],
        },
        {
          id: "r2",
          role: "fact",
          text: "The longest known sakehe is said to belong to the owl story of Shizunai, told by Suteno Orita. It ends with the owl's hum hum.",
          claimIds: ["owl-sakehe"],
        },
        {
          id: "r3",
          role: "frame",
          text: "Here it is, as the museum writes it.",
        },
        refrainLine("r4"),
      ],
    },
    {
      id: "telling",
      title: "Every telling is new",
      lines: [
        {
          id: "t1",
          role: "fact",
          text: "Oral literature changes a little each time it is told, even by the same teller.",
          claimIds: ["telling-varies"],
        },
        {
          id: "t2",
          role: "fact",
          text: "The museum once played a kamuy yukar told by Nabe Shirasawa of Chitose, and its library still keeps the recording.",
          claimIds: ["green-pigeon"],
        },
        {
          id: "t3",
          role: "frame",
          text: "So the owl guide does not retell the owl story. It points to its teller, and to the place that keeps it.",
        },
        refrainLine("t4"),
      ],
    },
  ],
  completion:
    "In Shizunai, Suteno Orita told the owl story with the longest known refrain. Each telling changes a little: the story belongs to its teller.",
};
