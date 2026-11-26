// 2026-11-26: the shipped models were made through the Hyper3D MCP connector
// and the clip through the PixVerse Claude Code plugin (see
// public/models/ATTRIBUTION.md); this script is the API route for later runs.
//
// Generates the few AI assets in public/: original props with Hyper3D Rodin
// (text prompt only, never museum photos) and one intro clip with PixVerse
// (image-to-video from our own island render). Keys come from the
// environment only; nothing is written to the repo except optimised outputs.
//
//   HYPER3D_API_KEY=… npm run assets:generate -- rodin herring saw
//   PIXVERSE_API_KEY=… npm run assets:generate -- pixverse intro
//
// Raw downloads go to .asset-raw/ (ignored). Then:
//   npm run assets:generate -- optimize   # GLB → public/models, MP4 → public/video
//
// API docs read 2026-11-26:
//   https://docs.hyper3d.ai/en/api-specification/rodin-gen2-5
//   https://docs.platform.pixverse.ai/image-to-video-and-video-templates-13016633e0
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";

const RAW = join(process.cwd(), ".asset-raw");
const MODELS = join(process.cwd(), "public", "models");
const VIDEO = join(process.cwd(), "public", "video");

/** Style shared by every prop: matches docs/STYLE.md (no photo-real textures). */
const STYLE =
  "Stylised hand-made diorama prop, simple clean shapes, soft matte painted colours, " +
  "no text, no logos, no base plate, single object, centred, upright.";

export const PROPS: Record<
  string,
  { prompt: string; bbox?: [number, number, number] }
> = {
  herring: {
    prompt: `A shallow round woven straw basket full of silver herring fish. ${STYLE}`,
  },
  saw: {
    prompt: `A two-person crosscut timber saw with a long steel blade and a wooden handle at each end, lying on a short cut log. ${STYLE}`,
  },
  shovel: {
    prompt: `A plain old iron coal shovel with a wooden shaft, a few lumps of black coal in the blade. ${STYLE}`,
  },
  deer: {
    prompt: `A standing sika deer stag with small antlers, brown summer coat with pale spots. ${STYLE}`,
  },
};

const INTRO = {
  image: join(RAW, "intro-still.png"),
  prompt:
    "Slow gentle camera drift over a small toy island diorama, soft clouds pass, " +
    "leaves sway, warm light, calm, no people, no text.",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function key(name: string): string {
  const v = process.env[name];
  if (!v)
    throw new Error(`${name} is not set (add it as an environment secret).`);
  return v;
}

async function call(
  url: string,
  init: RequestInit,
  timeoutMs = 30_000,
): Promise<unknown> {
  const res = await fetch(url, {
    ...init,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${url}: ${body.slice(0, 300)}`);
  return JSON.parse(body);
}

async function download(url: string, file: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`download ${res.status}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

// ---------- Hyper3D Rodin ----------

type RodinSubmit = {
  uuid?: string;
  jobs?: { subscription_key: string };
  error?: string;
};
type RodinStatus = { jobs?: { status: string }[]; error?: string };
type RodinDownload = { list?: { url: string; name: string }[]; error?: string };

async function rodin(id: string) {
  const prop = PROPS[id];
  if (!prop) throw new Error(`unknown prop ${id}`);
  const auth = { Authorization: `Bearer ${key("HYPER3D_API_KEY")}` };
  const form = new FormData();
  form.set("prompt", prop.prompt);
  form.set("tier", process.env.RODIN_TIER ?? "Gen-2.5-Low");
  form.set("mesh_mode", "Raw");
  form.set("quality_override", "30000");
  form.set("material", "PBR");
  form.set("geometry_file_format", "glb");
  form.set("seed", "7");
  const sub = (await call("https://api.hyper3d.com/api/v2/rodin", {
    method: "POST",
    headers: auth,
    body: form,
  })) as RodinSubmit;
  if (sub.error || !sub.uuid || !sub.jobs)
    throw new Error(`rodin ${id}: ${sub.error}`);
  console.log(`rodin ${id}: submitted ${sub.uuid}`);

  let wait = 5_000;
  const end = Date.now() + 15 * 60_000;
  for (;;) {
    if (Date.now() > end) throw new Error(`rodin ${id}: timed out`);
    await sleep(wait);
    wait = Math.min(wait * 1.5, 30_000);
    const st = (await call("https://api.hyper3d.com/api/v2/status", {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify({ subscription_key: sub.jobs.subscription_key }),
    })) as RodinStatus;
    const s = st.jobs?.map((j) => j.status) ?? [];
    console.log(`rodin ${id}: ${s.join(",")}`);
    if (s.includes("Failed")) throw new Error(`rodin ${id}: failed`);
    if (s.length && s.every((x) => x === "Done")) break;
  }
  const dl = (await call("https://api.hyper3d.com/api/v2/download", {
    method: "POST",
    headers: { ...auth, "Content-Type": "application/json" },
    body: JSON.stringify({ task_uuid: sub.uuid }),
  })) as RodinDownload;
  const glb = dl.list?.find((f) => f.name.endsWith(".glb"));
  if (!glb)
    throw new Error(`rodin ${id}: no glb in ${JSON.stringify(dl.list)}`);
  await download(glb.url, join(RAW, `${id}.glb`));
  writeFileSync(
    join(RAW, `${id}.json`),
    JSON.stringify(
      {
        tool: "Hyper3D Rodin",
        task: sub.uuid,
        prompt: prop.prompt,
        date: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  console.log(`rodin ${id}: saved .asset-raw/${id}.glb`);
}

// ---------- PixVerse ----------

type Px<T> = { ErrCode: number; ErrMsg: string; Resp: T };

async function pixverse() {
  if (!existsSync(INTRO.image))
    throw new Error(
      `missing ${INTRO.image} (a still of our own island render)`,
    );
  const headers = () => ({
    "API-KEY": key("PIXVERSE_API_KEY"),
    "Ai-trace-id": randomUUID(),
  });
  const base = "https://app-api.pixverse.ai/openapi/v2";
  const form = new FormData();
  form.set(
    "image",
    new Blob([readFileSync(INTRO.image)], { type: "image/png" }),
    "intro.png",
  );
  const up = (await call(`${base}/image/upload`, {
    method: "POST",
    headers: headers(),
    body: form,
  })) as Px<{ img_id: number }>;
  if (up.ErrCode !== 0) throw new Error(`pixverse upload: ${up.ErrMsg}`);
  const gen = (await call(`${base}/video/img/generate`, {
    method: "POST",
    headers: { ...headers(), "Content-Type": "application/json" },
    body: JSON.stringify({
      img_id: up.Resp.img_id,
      prompt: INTRO.prompt,
      model: process.env.PIXVERSE_MODEL ?? "v6",
      duration: 5,
      quality: "540p",
      motion_mode: "normal",
      seed: 7,
    }),
  })) as Px<{ video_id: number }>;
  if (gen.ErrCode !== 0) throw new Error(`pixverse generate: ${gen.ErrMsg}`);
  const vid = gen.Resp.video_id;
  console.log(`pixverse: video ${vid}`);
  const end = Date.now() + 10 * 60_000;
  for (;;) {
    if (Date.now() > end) throw new Error("pixverse: timed out");
    await sleep(5_000);
    const r = (await call(`${base}/video/result/${vid}`, {
      headers: headers(),
    })) as Px<{ status: number; url?: string }>;
    console.log(`pixverse: status ${r.Resp?.status}`);
    if (r.Resp?.status === 1 && r.Resp.url) {
      await download(r.Resp.url, join(RAW, "intro.mp4"));
      writeFileSync(
        join(RAW, "intro.json"),
        JSON.stringify(
          {
            tool: "PixVerse",
            video: vid,
            prompt: INTRO.prompt,
            date: new Date().toISOString(),
          },
          null,
          2,
        ),
      );
      console.log("pixverse: saved .asset-raw/intro.mp4");
      return;
    }
    if ([6, 7, 8].includes(r.Resp?.status))
      throw new Error(`pixverse: status ${r.Resp.status}`);
  }
}

// ---------- optimise for the web (docs/STYLE.md budgets) ----------

function optimize() {
  mkdirSync(MODELS, { recursive: true });
  mkdirSync(VIDEO, { recursive: true });
  for (const f of readdirSync(RAW)) {
    if (f.endsWith(".glb")) {
      const out = join(MODELS, f);
      execFileSync(
        "npx",
        [
          "--yes",
          "@gltf-transform/cli@4",
          "optimize",
          join(RAW, f),
          out,
          "--compress",
          "meshopt",
          "--texture-compress",
          "webp",
          "--texture-size",
          "512",
          "--simplify",
          "true",
          "--simplify-ratio",
          "0.6",
        ],
        { stdio: "inherit" },
      );
      console.log(`${f}: ${readFileSync(out).length} bytes`);
    }
  }
  const mp4 = join(RAW, "intro.mp4");
  if (existsSync(mp4)) {
    const common = ["-y", "-i", mp4, "-an", "-vf", "scale=960:-2,fps=24"];
    execFileSync(
      "ffmpeg",
      [
        ...common,
        "-c:v",
        "libx264",
        "-crf",
        "30",
        "-preset",
        "slow",
        "-movflags",
        "+faststart",
        "-pix_fmt",
        "yuv420p",
        join(VIDEO, "intro.mp4"),
      ],
      { stdio: "inherit" },
    );
    execFileSync(
      "ffmpeg",
      [
        ...common,
        "-c:v",
        "libvpx-vp9",
        "-crf",
        "40",
        "-b:v",
        "0",
        join(VIDEO, "intro.webm"),
      ],
      { stdio: "inherit" },
    );
    execFileSync(
      "ffmpeg",
      [
        "-y",
        "-i",
        mp4,
        "-vframes",
        "1",
        "-vf",
        "scale=960:-2",
        "-q:v",
        "70",
        join(VIDEO, "intro-poster.webp"),
      ],
      { stdio: "inherit" },
    );
  }
}

async function main() {
  mkdirSync(RAW, { recursive: true });
  const [cmd, ...ids] = process.argv.slice(2);
  if (cmd === "rodin") {
    for (const id of ids.length ? ids : Object.keys(PROPS)) await rodin(id);
  } else if (cmd === "pixverse") await pixverse();
  else if (cmd === "optimize") optimize();
  else
    console.log("usage: assets:generate -- rodin [ids…] | pixverse | optimize");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
