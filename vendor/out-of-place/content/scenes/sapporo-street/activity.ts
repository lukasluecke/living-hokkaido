// The hide-and-seek activity for the Meiji Sapporo street scene (kind "hide-seek").
import type { HideSeekActivityInput } from "../../../src/integration/contracts";

export const sapporoStreetHideSeek: HideSeekActivityInput = {
  kind: "hide-seek",
  id: "hide-seek-sapporo-street",
  knowledgeId: "meiji-sapporo-street",
  title: "Out of Place: a Meiji street in Sapporo",
  claimIds: [
    "sapporo-clock-tower-1878",
    "hokkaido-government-office-1888",
    "sapporo-rickshaws",
    "western-ceremonial-dress-1872",
    "sapporo-grid-1871",
    "sapporo-gas-lamps-1912",
    "sapporo-electric-light-1891",
    "sapporo-streetcar-1918",
    "sapporo-tv-tower-1957",
  ],
  scene: "sapporo-street",
  prompt:
    "One player hides Nuri on the street by painting it to blend in with the crowd and the buildings. The other player looks for whoever seems out of place.",
  captionClaimIds: ["sapporo-clock-tower-1878"],
  accurateClaimIds: [
    "hokkaido-government-office-1888",
    "sapporo-rickshaws",
    "western-ceremonial-dress-1872",
    "sapporo-clock-tower-1878",
  ],
  anachronismClaimIds: [
    "sapporo-gas-lamps-1912",
    "sapporo-electric-light-1891",
    "sapporo-streetcar-1918",
    "sapporo-tv-tower-1957",
  ],
  completion:
    "Sapporo was planned from scratch: in 1871 the Kaitakushi laid out its grid of blocks, divided by Ōdōri and the Sōsei River.",
};
