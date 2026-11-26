// Standalone page: page chrome and prefs live here, never inside the game.
// The URL and storage are read here only; the game gets them as props.
// ?seed=N picks a street (default: today's slope, e.g. 20261126);
// ?lang=ja for Japanese (default: the browser's language);
// ?at=N (dev) starts N metres down.
import { dailySeed, shareLink } from "./core/score";
import { type Lang, langFrom, strings } from "./i18n";
import { mountSlope, type SlopeHandle } from "./embed";

const host = document.getElementById("game");
if (!host) throw new Error("#game missing");

const params = new URLSearchParams(location.search);
const asked = Number(params.get("seed"));
const seed =
  params.has("seed") && Number.isFinite(asked) ? asked : dailySeed(new Date());
const at = Number(params.get("at") ?? 0);
// Language: ?lang=ja or ?lang=en, else the browser's language.
let lang = langFrom(params.get("lang") ?? navigator.language);
// Exhibit names for this page (the host gives its own, in its language).
const JA_LABELS: Record<string, string> = {
  "warehouse-wall": "倉庫の壁",
  shachihoko: "鯱",
  "straw-sacks": "俵",
  "sack-cart": "荷車",
  "herring-boxes": "鰊の木箱",
  canal: "運河",
};
// Dev exhibits: one per look. The host gives cited claims; this page only
// shows placeholders. ?seen=all marks all as seen (the street shows 4).
const looks = [
  "warehouse-wall",
  "shachihoko",
  "straw-sacks",
  "sack-cart",
  "herring-boxes",
  "canal",
] as const;
const findsFor = (lang: Lang) =>
  looks.map((look) => ({
    id: look,
    label: lang === "ja" ? (JA_LABELS[look] ?? look) : look,
    look,
    // No cited claim on the standalone page (the host passes them), so no
    // text: the end card then shows only the name, never a placeholder.
    text: "",
  }));
const seen = params.get("seen") === "all" ? [...looks] : [];
// Local best per slope. Storage can be missing or blocked: then no best.
const bestKey = `dont-fall-on-the-slope:best:${seed}`;
const readBest = () => {
  try {
    return Number(localStorage.getItem(bestKey)) || 0;
  } catch {
    return 0;
  }
};
let game: SlopeHandle | null = null;
/** (Re)mount the game in a language; the language button calls this. */
function mount() {
  document.documentElement.lang = lang;
  document.title = strings(lang).title;
  game?.destroy();
  game = mountSlope(host as HTMLElement, {
    activityId: "slope-run",
    lang,
    onLangChange: (next) => {
      lang = next;
      // Keep the choice in the address bar (so a reload keeps it).
      const u = new URL(location.href);
      u.searchParams.set("lang", next);
      history.replaceState(null, "", u);
      mount();
    },
    seed,
    best: readBest(),
    shareUrl: shareLink(location.href, seed),
    onRunEnd: (run) => {
      if (run.distance <= readBest()) return;
      try {
        localStorage.setItem(bestKey, String(run.distance));
      } catch {
        // No storage: the best lasts for this visit only.
      }
    },
    startAt: Number.isFinite(at) ? Math.max(0, at) : 0,
    finds: findsFor(lang),
    seen,
    prefs: {
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      webgl: true,
    },
    emit: (event) => console.info("[event]", event),
  });
}
mount();
