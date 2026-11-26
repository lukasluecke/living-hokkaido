// Generates the owl's AI voice lines with ElevenLabs text to speech:
// the owl guide lines (src/content/bark-to-cloth/guide.ts) and the English
// lines of the two owl-read stories. The owl is a fictional guide; these are
// AI voices, labelled as such in the UI. The Ainu refrain is never voiced.
//
//   npm run audio:voices [-- owl story-owl]   # reads ELEVENLABS_API_KEY
//   from the environment or from .env.local (never committed)
//
// Output: public/audio/voice/<group>/<lineId>.mp3 (22 kHz, 32 kbps, mono)
// and public/audio/voice/<group>/index.json with word start times, so the
// captions follow the voice. Lines whose text did not change are skipped.
//
// API (read 2026-11-26):
//   POST /v1/text-to-speech/{voice_id}/with-timestamps
//   https://elevenlabs.io/docs/api-reference/text-to-speech/convert-with-timestamps
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import type { ActivityOf, VoiceIndex } from "@/contracts";
import { activityKinds } from "../../src/content/bark-to-cloth/activity-kinds";
import { placeActivities } from "../../src/content/bark-to-cloth/place-activities";
import { guide } from "../../src/content/bark-to-cloth/guide";
import { highlights } from "../../src/content/bark-to-cloth/highlights";
import { owlStory } from "../../src/content/bark-to-cloth/museum-activities";

try {
  process.loadEnvFile(".env.local");
} catch {}
const KEY = process.env.ELEVENLABS_API_KEY?.trim();
// "Living Hokkaido owl guide": designed with ElevenLabs Voice Design
// (2026-11-26) from: "An older woman in her seventies, a gentle village
// storyteller. Warm, low and a little husky voice, calm and unhurried, with
// soft breaths between phrases. She speaks like a kind guardian owl
// remembering long ago, tender and dignified, never theatrical. Soft and
// intimate, close to the microphone." No cloned person.
// Override with ELEVENLABS_OWL_VOICE.
const VOICE = process.env.ELEVENLABS_OWL_VOICE ?? "aLbEsWOUStPIYvDVdp7K";
const MODEL = process.env.ELEVENLABS_TTS_MODEL ?? "eleven_multilingual_v2";
const FORMAT = "mp3_22050_32";
const OUT = join(process.cwd(), "public", "audio", "voice");

const responseSchema = z.object({
  audio_base64: z.string().min(1),
  alignment: z
    .object({
      characters: z.array(z.string()),
      character_start_times_seconds: z.array(z.number()),
      character_end_times_seconds: z.array(z.number()),
    })
    .nullable(),
});

type Line = { id: string; text: string };

function storyLines(a: unknown): Line[] {
  const s = a as ActivityOf<"story">;
  const lines = s.chapters.flatMap((c) =>
    c.lines.flatMap((l) =>
      l.role === "refrain" ? [] : [{ id: l.id, text: l.text }],
    ),
  );
  // The refrain only when the activity opts in (AI imitation, labelled).
  const v = s.narrator.voice as { kind: string; refrain?: boolean };
  if (v.kind === "ai-voice" && v.refrain && s.refrain)
    lines.push({ id: "refrain", text: s.refrain.text });
  return lines;
}

const story = activityKinds.find((a) => a.kind === "story");
const groups: Record<string, Line[]> = {
  owl: [
    ...guide.map((g) => ({ id: g.id, text: g.text })),
    ...highlights.flatMap((h) =>
      h.owl ? [{ id: `highlight-${h.id}`, text: h.owl }] : [],
    ),
  ],
  ...(story ? { [story.id]: storyLines(story) } : {}),
  [owlStory.id]: storyLines(owlStory),
  // "Build the scene" walkthroughs: one line per step (say + ask).
  ...Object.fromEntries(
    placeActivities.map((a) => {
      const p = a as ActivityOf<"place">;
      return [
        p.id,
        p.steps.map((s) => ({
          id: s.id,
          text: s.ask ? `${s.say} ${s.ask}` : s.say,
        })),
      ];
    }),
  ),
};

/** Start time (s) of each space-separated word, as the captions split them. */
function wordStarts(text: string, chars: string[], starts: number[]) {
  const out: number[] = [];
  let atWordStart = true;
  for (let i = 0; i < chars.length && i < text.length; i++) {
    if (chars[i] === " ") atWordStart = true;
    else if (atWordStart) {
      out.push(Math.round((starts[i] ?? 0) * 100) / 100);
      atWordStart = false;
    }
  }
  return out;
}

async function speak(text: string) {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=${FORMAT}`,
    {
      method: "POST",
      headers: { "xi-api-key": KEY ?? "", "content-type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: MODEL,
        voice_settings: { stability: 0.55, similarity_boost: 0.75 },
      }),
      signal: AbortSignal.timeout(60_000),
    },
  );
  if (!res.ok)
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return responseSchema.parse(await res.json());
}

async function main() {
  if (!KEY) {
    console.error("ELEVENLABS_API_KEY is missing (put it in .env.local).");
    process.exit(1);
  }
  const only = process.argv.slice(2);
  for (const [group, lines] of Object.entries(groups)) {
    if (only.length && !only.includes(group)) continue;
    const dir = join(OUT, group);
    mkdirSync(dir, { recursive: true });
    const indexPath = join(dir, "index.json");
    const index: VoiceIndex = existsSync(indexPath)
      ? JSON.parse(readFileSync(indexPath, "utf8"))
      : { voice: "", model: "", lines: {} };
    index.voice = VOICE;
    index.model = MODEL;
    for (const line of lines) {
      const hash = createHash("sha256")
        .update(`${VOICE}|${MODEL}|${line.text}`)
        .digest("hex")
        .slice(0, 12);
      const file = join(dir, `${line.id}.mp3`);
      if (index.lines[line.id]?.hash === hash && existsSync(file)) continue;
      const r = await speak(line.text);
      writeFileSync(file, Buffer.from(r.audio_base64, "base64"));
      const a = r.alignment;
      index.lines[line.id] = {
        hash,
        duration: a
          ? Math.round((a.character_end_times_seconds.at(-1) ?? 0) * 100) / 100
          : 0,
        words: a
          ? wordStarts(line.text, a.characters, a.character_start_times_seconds)
          : [],
      };
      console.log(`${group}/${line.id}.mp3  ${line.text.slice(0, 60)}`);
    }
    writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
