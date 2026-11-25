// Standalone page: plays the game full-screen, the way a host app would mount
// it, and logs every emitted event. Page chrome (background, rotate prompt,
// sources panel) lives here, never in the game.
import { sapporoStreetHideSeek } from "../content/scenes/sapporo-street/activity";
import { sapporoStreetKnowledge } from "../content/scenes/sapporo-street/knowledge";
import { otaruHideSeek } from "../content/scenes/otaru-herring-warehouse/activity";
import { otaruWarehouseKnowledge } from "../content/scenes/otaru-herring-warehouse/knowledge";
import { mountOutOfPlace } from "./embed";
import {
  type ExperienceEvent,
  hideSeekActivitySchema,
  knowledgeEntrySchema,
  resolveClaims,
} from "./integration/contracts";
import { css } from "./style/palette";

const knowledgeEntries = [otaruWarehouseKnowledge, sapporoStreetKnowledge].map(
  (k) => knowledgeEntrySchema.parse(k),
);
const claims = Object.assign(
  {},
  ...knowledgeEntries.map(resolveClaims),
) as ReturnType<typeof resolveClaims>;
const activities = [otaruHideSeek, sapporoStreetHideSeek].map((a) =>
  hideSeekActivitySchema.parse(a),
);

document.body.style.background = css("backdrop");

// Landscape-first game: on a portrait touch device, ask the player to turn it.
const style = document.createElement("style");
style.textContent = `
  #rotate { display: none; position: fixed; inset: 0; z-index: 10; align-items: center; justify-content: center;
    text-align: center; padding: 32px; background: ${css("backdropDeep")}; color: ${css("cream")};
    font: 24px Georgia, serif; }
  @media (orientation: portrait) and (pointer: coarse) { #rotate { display: flex; } }
  #game:focus-visible { outline: 3px solid ${css("sunGlow")}; outline-offset: -3px; }
  #sources { position: fixed; inset: auto 16px 16px 16px; max-width: 640px; margin: 0 auto; z-index: 5;
    background: ${css("cream")}; color: ${css("outline")}; border: 4px solid ${css("outline")}; border-radius: 14px;
    padding: 16px 20px; font: 15px/1.45 Georgia, serif; box-shadow: 0 6px 0 ${css("backdropDeep")}; }
  #sources h2 { margin: 0 0 8px; font-size: 18px; }
  #sources li { margin-bottom: 8px; }
  #sources button { font: inherit; padding: 6px 14px; border-radius: 10px; border: 3px solid ${css("outline")};
    background: ${css("woodLight")}; color: ${css("cream")}; cursor: pointer; }
`;
document.head.append(style);
const rotate = document.createElement("div");
rotate.id = "rotate";
rotate.textContent = "Turn your phone sideways to play ↻";
document.body.append(rotate);

/** Stand-in for living-hokkaido's reveal part: lists every claim and its sources. */
function showSources(returnFocus: HTMLElement, knowledgeId: string) {
  const knowledge = knowledgeEntries.find((k) => k.id === knowledgeId);
  const activity = activities.find((a) => a.knowledgeId === knowledgeId);
  if (!knowledge || !activity) return;
  document.getElementById("sources")?.remove();
  const panel = document.createElement("section");
  panel.id = "sources";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "How do we know?");
  const h = document.createElement("h2");
  h.textContent = `How do we know? · ${knowledge.presentation === "research-preview" ? "Research preview · review pending" : "Reviewed"}`;
  const list = document.createElement("ul");
  for (const id of activity.claimIds) {
    const c = claims[id];
    const li = document.createElement("li");
    const cites = c.claim.citations
      .map((cit) => {
        const src = c.sources.find((s) => s.id === cit.sourceId);
        return `${src?.title ?? cit.sourceId} (${cit.locator})`;
      })
      .join("; ");
    li.textContent = `${c.claim.text} Source: ${cites}`;
    list.append(li);
  }
  const close = document.createElement("button");
  close.textContent = "Close";
  close.onclick = () => {
    panel.remove();
    returnFocus.focus();
  };
  panel.append(h, list, close);
  document.body.append(panel);
  close.focus();
}

const host = document.getElementById("game");
if (!host) throw new Error("Missing #game element");

const speed = Number(new URLSearchParams(location.search).get("speed"));
const emit = (event: ExperienceEvent) => {
  console.info("[out-of-place] event", event);
  if (event.type === "reveal.open") showSources(host, event.knowledgeId);
};

mountOutOfPlace(host, {
  activity: activities[0],
  activities,
  claims,
  emit,
  prefs: {
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    webgl: true,
  },
  speed: Number.isFinite(speed) && speed > 0 ? speed : 1,
});
