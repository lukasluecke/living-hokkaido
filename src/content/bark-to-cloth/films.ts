// Story films for the story hall in the Listening grove. Demo rule (Lukas
// 2026-11-26): team-made, AI-assisted content may be shown before it is
// cited, if it is labelled as such; a finished product would send it through
// curator approval first.
import { type FilmInput, filmSourceFrom } from "@/contracts";

/**
 * Uploaded 2026-11-26: a 720p H.264 web version (about 20 MB, 1 min 44 s,
 * English subtitles burned in) of Yuling's 4K "ainu owl god" film.
 * To change it, set either the R2 key "owl-story.mp4"
 * (upload it to the bucket living-hokkaido-museum under exactly that name;
 * the key is in PUBLIC_MEDIA) or a YouTube link. Empty = "coming soon".
 */
export const OWL_FILM_SOURCE = "owl-story.mp4";

export const owlFilm: FilmInput = {
  title: "The owl tells a folktale",
  teaser: "A short film about an Ainu spirit, told by the owl",
  credit: "Made by our team (Yuling) with AI tools",
  note: "A folklore retelling for this demo, not a museum source. In the finished product, a curator and Ainu advisers would check and approve it first.",
  source: filmSourceFrom(OWL_FILM_SOURCE),
};
