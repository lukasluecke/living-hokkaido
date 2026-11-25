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
