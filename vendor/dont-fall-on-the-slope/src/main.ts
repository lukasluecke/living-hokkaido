// Standalone page: page chrome and prefs live here, never inside the game.
// ?seed=N picks a different street; ?at=N (dev) starts N metres down.
import { mountSlope } from "./embed";

const host = document.getElementById("game");
if (!host) throw new Error("#game missing");

const params = new URLSearchParams(location.search);
const seed = Number(params.get("seed") ?? 1);
const at = Number(params.get("at") ?? 0);
mountSlope(host, {
  activityId: "slope-run",
  seed: Number.isFinite(seed) ? seed : 1,
  startAt: Number.isFinite(at) ? Math.max(0, at) : 0,
  prefs: {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    webgl: true,
  },
  emit: (event) => console.info("[event]", event),
});
