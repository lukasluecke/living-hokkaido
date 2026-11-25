import {
  CONTRACT_VERSION,
  type ContentPack,
  loadContentPack,
} from "@/contracts";
import { activities } from "./activities";
import { artifacts } from "./artifacts";
import { guide } from "./guide";
import { locations, overview, owlHome } from "./island";
import { stamps } from "./journal";
import { barkToCloth } from "./knowledge";
import { memories } from "./memories";
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
  knowledge: [barkToCloth, houseOverTime, hokkaidoMuseum],
  island: { owlHome, overview, locations },
  scenes: [lakeHouse, listeningGrove, makersClearing, memoryCabin],
  artifacts,
  activities,
  stamps,
  guide,
  memories,
  timelines: [houseTimeline],
};

/** Parsed with defaults applied. Throws if any reference is broken. */
export const barkToClothPack: ContentPack = loadContentPack(barkToClothRaw);
