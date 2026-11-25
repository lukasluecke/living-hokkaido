// The hide-and-seek activity for this scene, in the proposed living-hokkaido
// activity shape (kind "hide-seek", see contract-proposal.ts).
import type { HideSeekActivityInput } from "../../../src/integration/contracts";

export const otaruHideSeek: HideSeekActivityInput = {
  kind: "hide-seek",
  id: "hide-seek-otaru-warehouse",
  knowledgeId: "otaru-herring-warehouse",
  title: "Out of Place: the herring warehouse",
  claimIds: [
    "otaru-warehouse-1890",
    "otaru-warehouse-shachihoko",
    "kitahama-tuff-on-timber",
    "herring-fertilizer",
    "kimura-warehouse-1894",
    "herring-peak-1897",
    "otaru-canal-1914-1923",
  ],
  scene: "otaru-herring-warehouse",
  prompt:
    "One player hides Nuri in the scene by painting it to blend in. The other player looks for whoever seems out of place.",
  captionClaimIds: ["otaru-warehouse-1890"],
  accurateClaimIds: [
    "kitahama-tuff-on-timber",
    "otaru-warehouse-shachihoko",
    "herring-fertilizer",
  ],
  anachronismClaimIds: ["otaru-canal-1914-1923"],
  completion:
    "Herring paid for stone warehouses like this one: in 1894 the Kimura family built theirs to store herring fertilizer. Hokkaido's herring catch peaked in 1897.",
};
