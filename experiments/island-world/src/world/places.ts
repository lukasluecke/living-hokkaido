// Showcase destinations on the authored island. Names are working titles,
// not cultural claims; the content team chooses the real stories.
import { SITES } from "./island";
export type Place = { id: string; name: string; x: number; z: number; open?: boolean };
export const HOME: Place = { id: "home", name: "Owl's perch", ...SITES.perch };
export const PLACES: Place[] = [
  { id: "lake", name: "Lake house", ...SITES.lake, open: true },
  { id: "forest", name: "Forest workshop", ...SITES.forest },
  { id: "river", name: "River village", ...SITES.river },
  { id: "coast", name: "Ice coast lookout", ...SITES.coast },
];
export const FLOWER_FIELD = SITES.lavender;
