# Presentation video script: phone and side panel (draft for review)

Status: approved by Lukas (26 Nov): subtitles first, voice-over maybe later. Omusha is recorded on a real GPU as its own take.
Built against `main` at 5b2be63 (26 Nov). Live site:
<https://living-hokkaido.luecke.workers.dev>
The old live-demo click path is in `DEMO-SCRIPT-live-v1.md`.

## Layout

- Output: 1920×1080, 30 fps, about 2:45.
- Left: the phone. We record a 390×844 portrait viewport (touch, mobile
  mode) at 2× pixel ratio (780×1688) and scale it to about 960 px high, in a
  simple phone frame.
- Right: the side panel. One title line and two or three short points per
  beat: what the visitor sees, and "behind the scenes" (which tool made what,
  how citations work).
- Bottom: subtitles. The owl lines are the real lines from the app
  (`highlights.ts`, `guide.ts`). We burn them in and also give an `.srt` file.
- Sound: the owl voice files from `public/audio/voice` and the ambient
  sounds, added in post at the beat times. (The frame-by-frame recorder does
  not capture audio.)

## Beats

Owl lines in quotes are the exact app text. "Say" lines are subtitles for a
narrator (or a voice-over by one of us). Times are a guide.

### 1. Title (0:00, 6 s)

- Phone: the island loads (first frame of beat 2, held).
- Subtitle: *Living Hokkaido: museum research you can walk through.*
- Panel: **Living Hokkaido** · An island with five places. Every fact comes
  from a real source, mostly panels from the Hokkaido Museum. · Runs in the
  phone browser. No app, no account.

### 2. The owl starts the tour (0:06, 14 s)

- Phone: "Starting the tour in 3…" card. Tap **Start now**. Owl close-up,
  then the camera pulls out to the snowy island.
- Owl: "Welcome to the island! I am the owl. Follow me through the
  highlights, or pick any glowing place to explore."
- Panel: **One guide, one step at a time** · The first screen is calm: one
  owl, one next step, "Explore freely" for the rest. · Owl voice: ElevenLabs
  text to speech, a voice we designed from a text prompt (not cloned). · Owl
  body: Hyper3D Rodin, from a text prompt. Island: three.js and React Three
  Fiber.

### 3. The owl's film (0:20, 15 s)

- Phone: tap **Watch the owl's film**. The owl flies to the listening grove.
  The film card opens. Play about 5 s.
- Owl: "First, sit with me in the grove. I have a story film for you."
- Panel: **A story film** · Made by our team (Yuling) with AI tools; the
  credit stays on the card. · Seedance 2.5 in PixVerse, with an ElevenLabs
  voice-over and music from ElevenLabs and Suno. · It is a retelling, not a museum source. Before
  real use, a curator and Ainu advisers check it.

### 4. Play the tonkori (0:35, 15 s)

- Phone: close the film. Tap **Play the tonkori**. Pluck strings
  3 3 3 1 3 4 5. Scroll a little to show the two source lines under the
  activity.
- Owl: "Now try the tonkori. Pluck the strings and listen."
- Panel: **Activities come from claims** · This one uses two museum sources:
  a visitor Q&A answer (Q017) and the museum's tonkori hands-on station. ·
  The source lines stay under the activity. · Synthetic tones show the
  structure; it is not a recording.

### 5. An object and "How do we know?" (0:50, 25 s)

- Phone: tap **1 Inner bark fibers** in the place bar. Drag the model to turn
  it. Tap **How do we know?**. Show source → claim → review status. Close.
- Say: "Every fact on the card is a claim with a source."
- Panel: **How citations work** · Each claim keeps a source ID and the exact
  place in that source (panel, photo, page). · "How do we know?" turns the
  card over: source, locator, claim, and human review status. "Draft" means
  nobody has reviewed it yet. · A source link shows where a fact comes from.
  It is not permission to reuse the media. · 3D model: Hyper3D Rodin from a
  text prompt, no museum photos or scans.

### 6. Ask the owl (1:15, 25 s)

- Phone: tap **Ask me a question**. Type `How was cloth made from bark?` and
  send. The answer comes in. Scroll to the cited claims and the "Read more"
  links.
- Say: "The owl answers only from cited claims."
- Panel: **A live model on a short leash** · Model: CarbonForge
  (carbonforge-flash) on the server. It sees only the claims that match the
  question and must answer with their IDs. The server checks each ID. · No
  claim fits: the owl says "I don't know yet". · "Read more" links come from
  Linkup, from heritage sites only. The model never sees them. · Mic button: ElevenLabs
  Scribe speech to text.
- Honesty: the video plays back a real reply that we recorded from the live
  site (`ask-live.json`). The panel says "Recorded live reply".

### 7. The house over time (1:40, 20 s)

- Phone: tap **Back to the tour**, then **See the house over time**. The owl
  flies to the lake house and the roof lifts. The timeline opens at "Pit
  dwellings, 7th–12th century". Tap **Next** two times. Tap **Watch: the
  river mouth in this era** (5 s clip).
- Owl: "Let us fly to the lake house and watch it change over time."
- Panel: **Five eras, one house** · Each era card has its sources ("How do
  we know?"). · The clips are AI-imagined (PixVerse V6), not historical
  footage. · The timeline says it plainly: Ainu culture is not frozen in the
  past.

### 8. The Omusha diorama (2:00, 15 s), optional (see question 1)

- Phone: **Step into the Omusha diorama**. The owl flies to the memory cabin.
  Turn the splat, open one spot with its cited panel text.
- Owl: "In the memory cabin, a museum diorama waits. Look around in it."
- Panel: **A museum diorama in 3D** · Shaw captured the Hokkaido Museum's
  1808 Omusha diorama as a Gaussian splat, shown with Spark. · The museum
  calls the scene intimidating, a show of power. So: no game, no score.

### 9. Don't Fall on the Slope (2:15, 18 s)

- Phone: **Don't fall on the slope**. The owl flies to the herring coast. Tap
  **Play**. Drag sideways to lean for about 8 s. Show the end card with one
  exhibit and its source.
- Owl: "To the coast! Slide down the icy street to the canal."
- Panel: **Erina's games** · An icy Otaru street (Phaser). The things you
  pass are real exhibits; the end card explains each one with its source. ·
  Her second game, "Out of Place", is hide-and-seek in the herring warehouse,
  with two players or against the AI.

### 10. Journal (2:33, 8 s)

- Phone: tap the stamp counter. The Heritage Journal shows the stamps.
- Panel: **Heritage Journal** · Places, objects, turned cards and activities
  give stamps. · Stored in the browser only.

### 11. Close (2:41, 8 s)

- Phone: back on the island (hold).
- Subtitle: *Sources first. Honest labels. A human gate before anything is
  published.*
- Panel: The same pipeline works for any museum or community archive. ·
  Open source (MIT) · living-hokkaido.luecke.workers.dev

Total: about 2:49 with beat 8, about 2:34 without it.

## Changes from the old script

- No season timelapse beat: the season menu is hidden on `main` (winter
  only).
- The tour now leads: film → tonkori → house over time → Omusha → slope.
- "Build the scene" is not in the video. It is still on the herring coast for
  a live demo.

## Questions for Lukas

1. **Omusha (beat 8):** the splat needs the demo password and a real GPU, and
   the capture is not in Git, so I cannot record it here. Options: you record
   about 15 s of it on your phone (screen recording) and I cut it in, or we
   leave beat 8 out.
2. **Narrator:** subtitles only, or a voice-over? If voice-over, who?
3. **Panel text:** is the partner list correct (ElevenLabs, Hyper3D Rodin,
   PixVerse, CarbonForge, Linkup, Spark)? Do you want OrcaRouter in it? It
   guards the "Contribute a story" ingest, which is not in this video.

## How I record it (after your OK)

1. Update `scripts/demo-video/steps.ts` for the tour flow and add a `--phone`
   preset (390×844, touch, 2× pixel ratio). Record in frame mode, in parts,
   with the journal state carried between parts.
2. Render the side panels and subtitles from this script (one HTML template,
   one PNG per beat), then compose with ffmpeg: phone left, panel right,
   subtitles bottom, owl voice and ambient sound on the audio track.
3. Deliver `presentation-demo.mp4` (1920×1080), the phone-only clip and the
   `.srt` file in project files.
