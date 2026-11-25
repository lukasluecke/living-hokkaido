// Japanese content dictionary: every content pack string with a Japanese
// draft. Split by area so threads can edit one file at a time.
import { jaClaims } from "./claims";
import { jaPlaces } from "./places";

export const jaContent: Record<string, string> = {
  ...jaPlaces,
  ...jaClaims,
};
