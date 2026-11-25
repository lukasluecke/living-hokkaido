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
import { houseOverTime, houseTimeline } from "./over-time";
import { lakeHouse } from "./scene";

export const barkToClothRaw = {
  contractVersion: CONTRACT_VERSION,
  id: "bark-to-cloth",
  knowledge: [barkToCloth, houseOverTime],
  island: { owlHome, overview, locations },
  scenes: [lakeHouse],
  artifacts,
  activities,
  stamps,
  guide,
  timelines: [houseTimeline],
};

/** Parsed with defaults applied. Throws if any reference is broken. */
export const barkToClothPack: ContentPack = loadContentPack(barkToClothRaw);
