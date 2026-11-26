import {
  CONTRACT_VERSION,
  type ContentPack,
  loadContentPack,
} from "@/contracts";
import { activities } from "./activities";
import { areaActivities, areaArtifacts, areaScenes } from "./area-scenes";
import { artifacts } from "./artifacts";
import { withEraClips, withSceneClips } from "./clips";
import { owlFilm } from "./films";
import { withGenerated } from "./generated-models";
import { gameActivities, gameActivityIdsByScene, gameKnowledge } from "./games";
import { guide } from "./guide";
import { highlights } from "./highlights";
import { locations, overview, owlHome } from "./island";
import { stamps } from "./journal";
import { barkToCloth } from "./knowledge";
import { memories } from "./memories";
import { landAndSea } from "./land-and-sea";
import { hokkaidoMuseum } from "./museum";
import { omushaCase, omushaKnowledge, omushaLook } from "./omusha";
import { houseOverTime, houseTimeline } from "./over-time";
import { placeActivities } from "./place-activities";
import { placeArtifacts, placeObjectActivities } from "./place-objects";
import {
  lakeHouse,
  listeningGrove,
  makersClearing,
  memoryCabin,
} from "./scene";

export const barkToClothRaw = {
  contractVersion: CONTRACT_VERSION,
  id: "bark-to-cloth",
  knowledge: [
    barkToCloth,
    houseOverTime,
    hokkaidoMuseum,
    landAndSea,
    omushaKnowledge,
    ...gameKnowledge,
  ],
  island: { owlHome, overview, locations },
  scenes: [
    lakeHouse,
    { ...listeningGrove, film: owlFilm },
    makersClearing,
    memoryCabin,
    ...withSceneClips(areaScenes).map((sc) => ({
      ...sc,
      activityIds: [
        ...(sc.activityIds ?? []),
        ...(gameActivityIdsByScene[sc.id] ?? []),
      ],
    })),
  ],
  artifacts: withGenerated([
    ...artifacts,
    ...areaArtifacts,
    ...placeArtifacts,
    omushaCase,
  ]),
  activities: [
    ...activities,
    ...areaActivities,
    ...gameActivities,
    ...placeActivities,
    ...placeObjectActivities,
    omushaLook,
  ],
  stamps,
  guide,
  highlights,
  memories,
  timelines: [withEraClips(houseTimeline)],
  // "Ask the owl" example questions, by where the visitor is. Questions
  // only; answers come from cited claims (tests/ask.test.ts checks that each
  // one finds a claim in its place).
  ask: {
    suggestions: [
      "What is attus?",
      "How did Ainu people get their food?",
      "How did Ainu houses change?",
      "What is a kamuy?",
    ],
    byLocation: {
      "lake-house": [
        "How do you soften bark?",
        "What happened around the hearth?",
        "Why is the pattern not mirrored?",
      ],
      "listening-grove": [
        "What is a sakehe?",
        "Do Ainu greetings differ by region?",
        "Why is the fish owl respected?",
      ],
      "makers-clearing": [
        "What is a loom called?",
        "How is the thread made?",
        "Who was seen as a full adult?",
      ],
      "memory-cabin": [
        "Are these clothes worn today?",
        "When was the Ainu Association founded?",
        "What is Upopoy?",
      ],
      "herring-coast": [
        "What did Ainu people catch in the sea?",
        "What was the catch made into?",
        "Why was salmon fishing banned?",
        "What is a marek?",
        "How does a kite harpoon work?",
        "How was a dugout canoe made in 1998?",
      ],
      "survey-forest": [
        "Why was the land cut into plots?",
        "Who guided the survey?",
        "What wild plants did people gather?",
        "What does the survey diorama show?",
        "How was grain harvested?",
      ],
      "animal-hills": [
        "How does a set bow work?",
        "Which animals were hunted?",
        "Is every animal a kamuy?",
        "What traps did hunters make?",
        "Which kamuy watches over the village?",
        "Why is the fire kamuy respected?",
      ],
      "coal-mountain": [
        "When did coal mining begin?",
        "What work was done in the winter woods?",
        "What do the coal mine figures show?",
        "Was Hokkaido a big coal producer?",
      ],
    },
    byArtifact: {
      fiber: ["When is bark peeled?", "How do you soften bark?"],
      cloth: ["How is the thread made?", "Is this a real weaving technique?"],
      garment: [
        "Why is the pattern not mirrored?",
        "How are the patterns made?",
        "Are these clothes worn today?",
      ],
      herring: [
        "What was the catch made into?",
        "Which fish stand for Hokkaido seafood?",
      ],
      "survey-stake": ["Why straight plots?", "Who guided the survey?"],
      "set-bow": ["How does a set bow work?", "How was a bear used?"],
      coal: [
        "How big was coal mining in Hokkaido?",
        "When did coal mining begin?",
      ],
    },
  },
};

/** Parsed with defaults applied. Throws if any reference is broken. */
export const barkToClothPack: ContentPack = loadContentPack(barkToClothRaw);
