"""Compose the presentation video: phone left, side panel right, subtitles.

Usage: python3 compose.py <out-dir> <main.mp4> <main.markers.json> <omusha-take.mp4> '[[a,b],...]'
The main take: npm run demo:video -- --phone --capture frames --shots start,film,tonkori,object,ask,overtime,skipomusha,slope,journal
The Omusha take (real GPU): --phone --phone-omusha --shots omusha. Beat texts: docs/DEMO-SCRIPT-PHONE.md.
Output: present.mp4 (1920x1080), phone.mp4 (phone only), present.srt.
"""
import json, subprocess, sys, os, html, pathlib

OUT = pathlib.Path(sys.argv[1])
MAIN = sys.argv[2]
MAIN_MARK = json.load(open(sys.argv[3]))
OMUSHA = sys.argv[4]
OM_CUTS = json.loads(sys.argv[5])  # [[a,b],[c,d]] seconds in the take to keep
REPO = pathlib.Path(__file__).resolve().parents[3]
VOICE = REPO / "public/audio/voice/owl"
FPS = 30
OUT.mkdir(parents=True, exist_ok=True)
TITLE_S, CLOSE_S = 5.0, 7.0


def sh(*a):
    subprocess.run(a, check=True)


def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))


marks = {m["label"]: m["at"] for m in MAIN_MARK["markers"]}
main_len = dur(MAIN)
# OMUSHA "-": the main take has the Omusha shot itself (real GPU).
INLINE = OMUSHA == "-"
if INLINE:
    t_skip = t_slope = marks["Don't fall on the slope"]
else:
    t_skip, t_slope = marks["Skip Omusha"], marks["Don't fall on the slope"]

# ---- phone track -------------------------------------------------------
parts = []
def clip(src, a, b, name):
    p = OUT / f"{name}.mp4"
    sh("ffmpeg", "-loglevel", "error", "-y", "-ss", f"{a:.3f}", "-i", src, "-t", f"{b-a:.3f}",
       "-vf", f"fps={FPS},scale=780:1688,setsar=1", "-an", "-c:v", "libx264", "-crf", "16", "-preset", "veryfast", "-pix_fmt", "yuv420p", str(p))
    parts.append(p)
    return b - a

def still(src, at, length, name):
    p = OUT / f"{name}.mp4"
    sh("ffmpeg", "-loglevel", "error", "-y", "-ss", f"{at:.3f}", "-i", src, "-frames:v", "1", str(OUT / f"{name}.png"))
    sh("ffmpeg", "-loglevel", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-t", f"{length}", "-i", str(OUT / f"{name}.png"),
       "-vf", "scale=780:1688,setsar=1", "-c:v", "libx264", "-crf", "16", "-preset", "veryfast", "-pix_fmt", "yuv420p", str(p))
    parts.append(p)

still(MAIN, 0.05, TITLE_S, "p0")
t = TITLE_S
off_main_a = t  # main time 0 -> final t
clip(MAIN, 0, t_skip, "p1"); t += t_skip
om_start = t
for i, (a, b) in enumerate([] if INLINE else OM_CUTS):
    t += clip(OMUSHA, a, b, f"p2{i}")
om_end = t
off_main_b = t - t_slope  # main time x (>= t_slope) -> final x + off_main_b
clip(MAIN, t_slope, main_len, "p3"); t += main_len - t_slope
still(MAIN, main_len - 0.1, CLOSE_S, "p4")
total = t + CLOSE_S
with open(OUT / "list.txt", "w") as f:
    for p in parts:
        f.write(f"file '{p}'\n")
phone = OUT / "phone.mp4"
sh("ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(OUT / "list.txt"), "-c", "copy", str(phone))

def fm(label):
    """Final time of a main marker."""
    at = marks[label]
    return at + (off_main_a if at < t_skip else off_main_b)

# ---- beats -------------------------------------------------------------
B = [
    dict(t=0, n="", title="Living Hokkaido", pts=[
        "An island with five places. Every fact comes from a real source, mostly panels from the Hokkaido Museum.",
        "Runs in the phone browser. No app, no account."],
        tools="", sub="Museum research you can walk through."),
    dict(t=fm("Start"), title="One guide, one step at a time", pts=[
        "A calm first screen: one owl, one next step. “Explore freely” opens the rest.",
        "Owl voice: ElevenLabs text to speech, a voice designed from a text prompt. Not a cloned person.",
        "Owl body: Hyper3D Rodin, from a text prompt. Island: three.js and React Three Fiber."],
        tools="ElevenLabs · Hyper3D Rodin", sub="Owl: “Welcome to the island! I am the owl. Follow me through the highlights.”"),
    dict(t=fm("Watch the owl's film"), title="A story film", pts=[
        "Made by our team (Yuling) with AI tools. The credit stays on the card.",
        "Seedance 2.5 in PixVerse, with an ElevenLabs voice-over and music from ElevenLabs and Suno.",
        "A retelling, not a museum source. Before real use, a curator and Ainu advisers check it."],
        tools="PixVerse · ElevenLabs · Suno", sub="The owl's film: a folktale, retold for this demo."),
    dict(t=fm("Play the tonkori"), title="Activities come from claims", pts=[
        "This one uses two museum sources: a visitor Q&A answer (Q017) and the museum's tonkori hands-on station.",
        "The source lines stay under the activity.",
        "Synthetic tones show the structure. It is not a recording."],
        tools="", sub="Owl: “Now try the tonkori. Pluck the strings and listen.”"),
    dict(t=fm("Inner bark fibers"), title="How citations work", pts=[
        "Each claim keeps a source ID and the exact place in that source: panel, photo, page.",
        "“How do we know?” turns the card over: source, locator, claim and human review status. “Draft” = not reviewed yet.",
        "3D model: Hyper3D Rodin from a text prompt. No museum photos or scans."],
        tools="Hyper3D Rodin", sub="Every fact on the card is a claim with a source."),
    dict(t=fm("Ask the owl"), title="A live model on a short leash", pts=[
        "CarbonForge (carbonforge-flash) sees only the claims that match the question, and must answer with their IDs. The server checks each one.",
        "No claim fits: the owl says “I don't know yet”.",
        "“Read more” links: Linkup, heritage sites only. The model never sees them. Mic: ElevenLabs Scribe."],
        tools="CarbonForge · Linkup · ElevenLabs Scribe", sub="The owl answers only from cited claims. (Recorded live reply.)"),
    dict(t=fm("See the house over time"), title="Five eras, one house", pts=[
        "Each era card has its sources (“How do we know?”).",
        "The 5-second clips are AI-imagined with PixVerse V6. Not historical footage.",
        "The timeline says it plainly: Ainu culture is not frozen in the past."],
        tools="PixVerse V6", sub="Owl: “Let us fly to the lake house and watch it change over time.”"),
    dict(t=fm("Step into the Omusha diorama") if INLINE else om_start, title="A museum diorama in 3D", pts=[
        "Shaw filmed the Hokkaido Museum's 1808 Omusha diorama and turned it into a Gaussian splat, shown in the browser with Spark.",
        "Each spot opens its cited panel text.",
        "The museum calls the scene intimidating, a show of power. So: no game, no score."],
        tools="Spark (Gaussian splat)", sub="Owl: “In the memory cabin, a museum diorama waits. Look around in it.”"),
    dict(t=fm("Don't fall on the slope"), title="Erina's games", pts=[
        "“Don't Fall on the Slope”: an icy Otaru street (Phaser). The things you pass are real exhibits, each with its source on the end card.",
        "“Out of Place”: hide-and-seek in the herring warehouse, with two players or against the AI."],
        tools="", sub="Owl: “To the coast! Slide down the icy street to the canal.”"),
    dict(t=fm("Journal") if "Journal" in marks else None, title="Heritage Journal", pts=[
        "Places, objects, turned cards and activities give stamps.",
        "Stored in this browser only."],
        tools="", sub="Everything you do earns a stamp."),
    dict(t=total - CLOSE_S, title="Sources first", pts=[
        "Honest labels, and a human gate before anything is published.",
        "The same pipeline works for any museum or community archive.",
        "Open source (MIT) · living-hokkaido.luecke.workers.dev"],
        tools="Built with Claude Code", sub="Sources first. Honest labels. A human gate."),
]
B = [b for b in B if b["t"] is not None]
for i, b in enumerate(B):
    b["end"] = B[i + 1]["t"] if i + 1 < len(B) else total

FONT = REPO / "public/fonts"
CSS = f"""
@font-face{{font-family:Mincho;src:url('file://{FONT}/shippori-mincho-b1-700.woff2')}}
@font-face{{font-family:Maru;font-weight:500;src:url('file://{FONT}/zen-maru-gothic-500.woff2')}}
@font-face{{font-family:Maru;font-weight:700;src:url('file://{FONT}/zen-maru-gothic-700.woff2')}}
*{{box-sizing:border-box;margin:0}}
body{{width:1920px;height:1080px;background:#fbf4e6;font-family:Maru,sans-serif;color:#2b2118;position:relative;overflow:hidden}}
.phone{{position:absolute;left:150px;top:30px;width:492px;height:1020px;border-radius:56px;background:#2b2118;
  box-shadow:0 18px 40px rgba(43,33,24,.25)}}
.col{{position:absolute;left:740px;top:96px;width:1060px}}
.kick{{font-weight:700;font-size:24px;letter-spacing:.16em;color:#c99a3b;text-transform:uppercase}}
h1{{font-family:Mincho,serif;font-size:72px;line-height:1.1;margin:18px 0 36px}}
ul{{list-style:none;padding:0}}
li{{font-size:34px;line-height:1.38;margin:0 0 24px;padding-left:40px;position:relative;color:#3b2e22}}
li:before{{content:'';position:absolute;left:4px;top:.5em;width:14px;height:14px;border-radius:50%;background:#e8c27a}}
.tools{{margin-top:12px;display:inline-block;font-weight:700;font-size:24px;padding:10px 20px;border-radius:999px;background:#f3e6c9;color:#7a5a12}}
.sub{{position:absolute;left:740px;right:120px;bottom:64px;padding:22px 30px;border-radius:20px;background:#1f2d46;color:#fff;
  font-weight:500;font-size:34px;line-height:1.35}}
"""
pages = []
for i, b in enumerate(B):
    kick = "Living Hokkaido" if i == 0 else f"{i} / {len(B) - 1}"
    lis = "".join(f"<li>{html.escape(p)}</li>" for p in b["pts"])
    tools = f'<div class="tools">{html.escape(b["tools"])}</div>' if b["tools"] else ""
    sub = f'<div class="sub">{html.escape(b["sub"])}</div>' if b["sub"] else ""
    pages.append(f"<!doctype html><meta charset=utf-8><style>{CSS}</style><div class=phone></div>"
                 f"<div class=col><div class=kick>{kick}</div><h1>{html.escape(b['title'])}</h1><ul>{lis}</ul>{tools}</div>{sub}")
json.dump(pages, open(OUT / "pages.json", "w"))
sh("node", str(pathlib.Path(__file__).with_name("render.cjs")), str(OUT / "pages.json"), str(OUT))

with open(OUT / "bg.txt", "w") as f:
    for i, b in enumerate(B):
        f.write(f"file '{OUT}/panel{i}.png'\nduration {b['end'] - b['t']:.3f}\n")
    f.write(f"file '{OUT}/panel{len(B)-1}.png'\n")

# ---- audio: owl voice at the bubble times -------------------------------
voice = [("welcome", fm("Start") + 0.3),
         ("highlight-tonkori", fm("Play the tonkori") - 2.5),
         ("highlight-over-time", fm("See the house over time") - 6.0),
         ("highlight-omusha", (fm("Step into the Omusha diorama") - 2.0) if INLINE else om_start + 0.3),
         ("highlight-slope", fm("Don't fall on the slope") - 1.5)]
ins, flt = [], []
for i, (k, at) in enumerate(voice):
    ins += ["-i", str(VOICE / f"{k}.mp3")]
    ms = int(max(0, at) * 1000)
    flt.append(f"[{i+2}:a]adelay={ms}|{ms}[a{i}]")
amix = "".join(f"[a{i}]" for i in range(len(voice))) + f"amix=inputs={len(voice)}:normalize=0[aout]"

out = OUT / "present.mp4"
sh("ffmpeg", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(OUT / "bg.txt"), "-i", str(phone), *ins,
   "-filter_complex",
   f"[0:v]fps={FPS},format=yuv420p[bg];[1:v]scale=452:978[ph];"
   f"[bg][ph]overlay=170:51:shortest=1[v];" + ";".join(flt) + ";" + amix,
   "-map", "[v]", "-map", "[aout]", "-t", f"{total:.3f}", "-c:v", "libx264", "-crf", "20", "-preset", "veryfast",
   "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", str(out))

def ts(x):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f"{int(h):02}:{int(m):02}:{int(s):02},{int((s % 1) * 1000):03}"
with open(OUT / "present.srt", "w") as f:
    for i, b in enumerate(B):
        f.write(f"{i+1}\n{ts(b['t'])} --> {ts(b['end'])}\n{b['sub']}\n\n")
json.dump({"total": total, "beats": [(b["title"], round(b["t"], 2)) for b in B]}, open(OUT / "beats.json", "w"), indent=1)
print("total", round(total, 1), [(b["title"], round(b["t"], 1)) for b in B])
