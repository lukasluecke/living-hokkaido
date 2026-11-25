import {
  CONTRACT_VERSION,
  type ContentPack,
  loadContentPack,
} from "@/contracts";
import { activities } from "./activities";
import { areaActivities, areaArtifacts, areaScenes } from "./area-scenes";
import { artifacts } from "./artifacts";
import { gameActivities, gameActivityIdsByScene, gameKnowledge } from "./games";
import { guide } from "./guide";
import { locations, overview, owlHome } from "./island";
import { stamps } from "./journal";
import { barkToCloth } from "./knowledge";
import { memories } from "./memories";
import { landAndSea } from "./land-and-sea";
import { hokkaidoMuseum } from "./museum";
import { houseOverTime, houseTimeline } from "./over-time";
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
    ...gameKnowledge,
  ],
  island: { owlHome, overview, locations },
  scenes: [
    lakeHouse,
    listeningGrove,
    makersClearing,
    memoryCabin,
    ...areaScenes.map((sc) => ({
      ...sc,
      activityIds: [
        ...(sc.activityIds ?? []),
        ...(gameActivityIdsByScene[sc.id] ?? []),
      ],
    })),
  ],
  artifacts: [...artifacts, ...areaArtifacts],
  activities: [...activities, ...areaActivities, ...gameActivities],
  stamps,
  guide,
  memories,
  timelines: [houseTimeline],
  // "Ask the owl" example questions. Questions only; answers come from claims.
  ask: {
    suggestions: [
      "How do you soften bark?",
      "What is attus?",
      "Why is the pattern not mirrored?",
      "Are these clothes worn today?",
      "How did houses change over time?",
    ],
  },
};

/** Parsed with defaults applied. Throws if any reference is broken. */
export const barkToClothPack: ContentPack = loadContentPack(barkToClothRaw);
