// Sound manifest shape. Framework-free (zod only), so tests and scripts can
// read it. The values live in manifest.ts: that is the one file to tune.
import { z } from "zod";
import { SEASON_IDS, type SeasonId } from "@/contracts";

const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const gain = z.number().min(0).max(4);

/** One sound file. `src` lists formats; the first one the browser plays wins. */
export const soundSchema = z.object({
  src: z.array(z.string().min(1)).min(1),
  /** Linear gain for this file (1 = as recorded). */
  volume: gain.default(1),
  /** Random playback-rate change per play, in cents (UI variety). */
  detuneJitter: z.number().min(0).max(1200).default(0),
  /** Row in public/audio/ATTRIBUTION.md. */
  credit: z.string().min(1),
});
export type Sound = z.infer<typeof soundSchema>;

/** Per-season gain for one ambient layer. Missing season = 0 (silent). */
export const seasonGainSchema = z.object(
  Object.fromEntries(SEASON_IDS.map((s) => [s, gain.optional()])) as Record<
    SeasonId,
    z.ZodOptional<typeof gain>
  >,
);
export type SeasonGain = z.infer<typeof seasonGainSchema>;

export const ambientLayerSchema = z.object({
  sound: id,
  /** Gain per season. The mix blends with seasonWeights() during timelapse. */
  seasons: seasonGainSchema,
});
export type AmbientLayer = z.infer<typeof ambientLayerSchema>;

export const VIEWS = [
  "island",
  "travel",
  "scene",
  "focus",
  "activity",
] as const;

export const zoneSchema = z.object({
  /** Experience views that play this zone. */
  views: z.array(z.enum(VIEWS)).min(1),
  /** Only in these detail scenes (ids). Empty = any scene. A zone with
   * scenes wins over one without for the same view. */
  scenes: z.array(id).default([]),
  layers: z.array(ambientLayerSchema),
});
export type Zone = z.infer<typeof zoneSchema>;

/** A cue = what plays for one moment (UI action or shared event). */
export const cueSchema = z.object({
  sound: id,
  volume: gain.default(1),
  /** Ignore repeats closer than this (ms). */
  minIntervalMs: z.number().min(0).default(0),
  /** Start after this delay (ms), e.g. a hoot after the owl lands. */
  delayMs: z.number().min(0).default(0),
});
export type Cue = z.infer<typeof cueSchema>;

export const soundManifestSchema = z.object({
  /** Bus gains. Visitors change only master (mute); tune the rest here. */
  buses: z.object({ master: gain, ambient: gain, ui: gain }),
  /** Ambient crossfade when the zone changes (s). */
  zoneFadeSec: z.number().min(0),
  /** Smoothing for season changes in the ambient mix (s). */
  seasonFadeSec: z.number().min(0),
  /** Ambient gain while the journal or reveal overlay is open. */
  overlayDuck: gain,
  sounds: z.record(id, soundSchema),
  zones: z.record(id, zoneSchema),
  cues: z.record(id, cueSchema),
  /** Shared event type -> cue id. Events not listed are silent. */
  events: z.record(z.string(), id),
  /**
   * DOM sounds without imports in parts. Order matters: the first rule whose
   * selector matches the hovered / clicked element (or a parent) wins.
   * `data-sound="<cue>"` and `data-sound-hover="<cue|off>"` on an element
   * always win over these rules.
   */
  dom: z.object({
    hover: z.array(z.object({ selector: z.string(), cue: id.nullable() })),
    click: z.array(z.object({ selector: z.string(), cue: id.nullable() })),
  }),
});
export type SoundManifest = z.input<typeof soundManifestSchema>;
export type ResolvedManifest = z.output<typeof soundManifestSchema>;

/** Check that every cue, layer and event points at something real. */
export function validateManifest(m: ResolvedManifest): string[] {
  const errors: string[] = [];
  for (const [zid, z] of Object.entries(m.zones))
    for (const l of z.layers)
      if (!m.sounds[l.sound]) errors.push(`zone ${zid}: no sound ${l.sound}`);
  for (const [cid, c] of Object.entries(m.cues))
    if (!m.sounds[c.sound]) errors.push(`cue ${cid}: no sound ${c.sound}`);
  for (const [ev, cid] of Object.entries(m.events))
    if (!m.cues[cid]) errors.push(`event ${ev}: no cue ${cid}`);
  for (const r of [...m.dom.hover, ...m.dom.click])
    if (r.cue && !m.cues[r.cue])
      errors.push(`dom ${r.selector}: no cue ${r.cue}`);
  const seen = new Map<string, string>();
  for (const [zid, z] of Object.entries(m.zones))
    for (const v of z.views.flatMap((x) =>
      z.scenes.length ? z.scenes.map((s) => `${x} (${s})`) : [x],
    )) {
      if (seen.has(v))
        errors.push(`view ${v} in zones ${seen.get(v)} and ${zid}`);
      seen.set(v, zid);
    }
  return errors;
}
