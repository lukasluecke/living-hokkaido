// Pure mixing rules: which zone plays, how loud each layer is, which cue an
// event plays. No Web Audio here, so tests can run in Node.
import {
  type ExperienceEvent,
  type ExperienceState,
  SEASON_IDS,
  seasonAt,
  seasonWeights,
} from "@/contracts";
import type { ResolvedManifest } from "./types";

export type View = ExperienceState["view"];

export function zoneForView(m: ResolvedManifest, view: View): string | null {
  for (const [id, z] of Object.entries(m.zones))
    if (z.views.includes(view)) return id;
  return null;
}

/**
 * Gain per ambient sound for a zone at a season value. Blends neighbour
 * seasons with seasonWeights(), so the timelapse fades smoothly.
 */
export function layerGains(
  m: ResolvedManifest,
  zoneId: string | null,
  season: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  const zone = zoneId ? m.zones[zoneId] : undefined;
  if (!zone) return out;
  const w = seasonWeights(season);
  for (const layer of zone.layers) {
    let g = 0;
    SEASON_IDS.forEach((s, i) => {
      g += w[i] * (layer.seasons[s] ?? 0);
    });
    out[layer.sound] = (out[layer.sound] ?? 0) + g;
  }
  return out;
}

/** Every ambient sound any zone uses (to fade out what is not playing). */
export function ambientSounds(m: ResolvedManifest): string[] {
  const set = new Set<string>();
  for (const z of Object.values(m.zones))
    for (const l of z.layers) set.add(l.sound);
  return [...set];
}

/**
 * Cue for a shared event, or null. `prevSeason` is the main season before
 * this event: season.set plays only when the main season changes.
 */
export function cueForEvent(
  m: ResolvedManifest,
  e: ExperienceEvent,
  prevSeason: number,
): string | null {
  const cue = m.events[e.type];
  if (!cue) return null;
  if (e.type === "season.set" && seasonAt(e.value) === seasonAt(prevSeason))
    return null;
  return cue;
}
