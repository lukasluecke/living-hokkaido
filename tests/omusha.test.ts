// Omusha diorama splat (vendor/sapporo-omusha): the splat-look kind, its
// content wiring, the look-closer logic and the museum asset gate.
import assert from "node:assert/strict";
import test from "node:test";
import {
  type ActivityOf,
  activitySchema,
  validateContentPack,
} from "@/contracts";
import { barkToClothPack, barkToClothRaw } from "@/content/bark-to-cloth";
import {
  access,
  COOKIE,
  tokenFor,
  validKey,
} from "@/integrations/museum-assets";
import {
  type MediaBucket,
  parseRange,
  PUBLIC_MEDIA,
  serveMedia,
} from "@/integrations/museum-assets/edge";
import {
  goalClaims,
  initialLook,
  isComplete,
  isIOS,
  openSpot,
  phaseForStatus,
} from "@/parts/activities/captures/splatLogic";

const look = () => {
  const a = barkToClothPack.activities.find((x) => x.id === "omusha-look");
  assert.ok(a && a.kind === "splat-look");
  return a as ActivityOf<"splat-look">;
};

test("the Omusha look is in the Memory cabin, with Shaw's spots", () => {
  const cabin = barkToClothPack.scenes.find((s) => s.id === "memory-cabin");
  assert.ok(cabin?.activityIds.includes("omusha-look"));
  const a = look();
  assert.equal(a.spots.filter((s) => s.group === "figure").length, 13);
  assert.equal(a.spots.filter((s) => s.group === "scene").length, 5);
  assert.equal(a.asset.key, "omusha.sog");
  assert.equal(a.asset.gated, false); // public (Lukas, 2026-11-26)
  const k = barkToClothPack.knowledge.find((x) => x.id === a.knowledgeId);
  assert.equal(k?.presentation, "research-preview");
  // Every claim cites a source of its own knowledge entry.
  for (const cl of k?.claims ?? [])
    for (const ci of cl.citations)
      assert.ok(
        k?.sources.some((s) => s.id === ci.sourceId),
        cl.id,
      );
});

test("splat-look: spot claims must be listed in claimIds", () => {
  const raw = structuredClone(barkToClothRaw) as typeof barkToClothRaw;
  const a = raw.activities.find((x) => x.id === "omusha-look") as {
    spots: { claimIds: string[] }[];
  };
  a.spots[0]?.claimIds.push("no-such-claim");
  assert.equal(activitySchema.safeParse(a).success, false);
  assert.ok(validateContentPack(raw).length > 0);
});

test("look closer completes after three panel notes", () => {
  const a = look();
  const known = () => true;
  const goal = goalClaims(a, known);
  assert.ok(goal.includes("omusha-elders"));
  assert.ok(!goal.includes("omusha-capture")); // context only, no spot
  let st = initialLook;
  st = openSpot(a, st, "elder-chrysanthemum");
  st = openSpot(a, st, "elder-maple-leaves");
  assert.equal(isComplete(a, st, known), false); // one note, twice
  st = openSpot(a, st, "interpreter");
  assert.equal(isComplete(a, st, known), false); // two notes
  st = openSpot(a, st, "ainu-woman");
  assert.equal(isComplete(a, st, known), true); // three notes
  for (const s of a.spots) st = openSpot(a, st, s.id);
  assert.equal(isComplete(a, st, known), true);
  assert.equal(st.opened.length, a.spots.length);
  assert.deepEqual(openSpot(a, st, "nobody"), st);
});

test("iPhone and iPad are detected for the safe splat path", () => {
  assert.ok(isIOS("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)", 5));
  assert.ok(isIOS("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 5));
  assert.ok(!isIOS("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", 0));
  assert.ok(!isIOS("Mozilla/5.0 (Linux; Android 15; Pixel 9)", 5));
});

test("asset status maps to a viewer phase", () => {
  assert.equal(phaseForStatus(200), "ready");
  assert.equal(phaseForStatus(401), "locked");
  assert.equal(phaseForStatus(503), "off");
  assert.equal(phaseForStatus(404), "missing");
  assert.equal(phaseForStatus(0), "missing");
});

test("museum asset gate: keys, password cookie, shut without a password", async () => {
  assert.ok(validKey("omusha.sog"));
  assert.ok(!validKey("../omusha.sog"));
  assert.ok(!validKey("omusha.ply"));
  assert.ok(!validKey("a/b.sog"));
  const req = (cookie?: string) =>
    new Request("https://x/api/museum-assets/omusha.sog", {
      headers: cookie ? { cookie } : {},
    });
  assert.equal(await access(req(), undefined), "off");
  assert.equal(await access(req(), "pw"), "locked");
  assert.equal(await access(req(`${COOKIE}=wrong`), "pw"), "locked");
  const t = await tokenFor("pw");
  assert.equal(await access(req(`a=1; ${COOKIE}=${t}`), "pw"), "open");
  assert.equal(await access(req(`${COOKIE}=${t}`), "other"), "locked");
  // A key marked public needs neither a password nor a cookie.
  assert.equal(await access(req(), undefined, true), "open");
});

test("public media list covers every non-gated capture", () => {
  for (const a of barkToClothPack.activities)
    if (a.kind === "splat-look" && !a.asset.gated)
      assert.ok(PUBLIC_MEDIA.has(a.asset.key), a.asset.key);
});

test("edge media: ranges, HEAD, 404 and fall-through", async () => {
  assert.deepEqual(parseRange("bytes=0-99"), { offset: 0, length: 100 });
  assert.deepEqual(parseRange("bytes=100-"), { offset: 100 });
  assert.deepEqual(parseRange("bytes=-10"), { suffix: 10 });
  assert.equal(parseRange("bytes=5-1"), null);
  assert.equal(parseRange("items=0-1"), null);
  const data = new Uint8Array(1000).map((_, i) => i % 256);
  const bucket: MediaBucket = {
    async head(key) {
      return key === "omusha.sog"
        ? { size: data.length, httpEtag: '"e"' }
        : null;
    },
    async get(key, opt) {
      if (key !== "omusha.sog") return null;
      const r = opt?.range;
      const start = !r ? 0 : "suffix" in r ? data.length - r.suffix : r.offset;
      const end =
        !r || "suffix" in r || r.length === undefined
          ? data.length
          : start + r.length;
      return {
        body: new Blob([data.slice(start, end)]).stream(),
        size: data.length,
        httpEtag: '"e"',
      };
    },
  };
  const url = "https://x/api/museum-assets/omusha.sog";
  const full = await serveMedia(new Request(url), bucket);
  assert.equal(full?.status, 200);
  assert.equal(full?.headers.get("content-length"), "1000");
  assert.equal((await full?.arrayBuffer())?.byteLength, 1000);
  const part = await serveMedia(
    new Request(url, { headers: { range: "bytes=10-19" } }),
    bucket,
  );
  assert.equal(part?.status, 206);
  assert.equal(part?.headers.get("content-range"), "bytes 10-19/1000");
  assert.deepEqual(
    [...new Uint8Array((await part?.arrayBuffer()) ?? new ArrayBuffer(0))],
    [10, 11, 12, 13, 14, 15, 16, 17, 18, 19],
  );
  const head = await serveMedia(new Request(url, { method: "HEAD" }), bucket);
  assert.equal(head?.status, 200);
  assert.equal(head?.headers.get("content-length"), "1000");
  const video = await serveMedia(
    new Request("https://x/api/museum-assets/intro.mp4"),
    bucket,
  );
  assert.equal(video?.status, 404);
  // Not public media, or no bucket: OpenNext answers.
  assert.equal(
    await serveMedia(
      new Request("https://x/api/museum-assets/secret.sog"),
      bucket,
    ),
    null,
  );
  assert.equal(await serveMedia(new Request("https://x/shell"), bucket), null);
  assert.equal(await serveMedia(new Request(url), undefined), null);
});
