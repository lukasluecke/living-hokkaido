// One art builder per scene id in the hide-seek contract.
import type { HideSeekActivity } from "../integration/contracts";
import type { SceneArt } from "./common";
import { buildOtaruWarehouse } from "./otaruWarehouse";
import { buildSapporoStreet } from "./sapporoStreet";

export const SCENE_ART: Record<HideSeekActivity["scene"], () => SceneArt> = {
  "otaru-herring-warehouse": buildOtaruWarehouse,
  "sapporo-street": buildSapporoStreet,
};
