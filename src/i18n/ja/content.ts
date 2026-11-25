// Japanese content dictionary: every content pack string with a Japanese
// draft. Split by area so threads can edit one file at a time.
import { jaActivities } from "./activities";
import { jaActivities2 } from "./activities2";
import { jaActivities3 } from "./activities3";
import { jaClaims } from "./claims";
import { jaPlaces } from "./places";

export const jaContent: Record<string, string> = {
  ...jaPlaces,
  ...jaClaims,
  ...jaActivities,
  ...jaActivities2,
  ...jaActivities3,
};
