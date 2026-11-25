"use client";
// slope-run kind: Don't Fall on the Slope (vendor/dont-fall-on-the-slope).
// Exhibits (real things of the street) carry their claim's text and source
// into the game; the journal's "found" list tells the game which ones this
// visitor saw before, so each Play brings new ones. The panel shows the
// street notebook and lists every claim. Without WebGL the game shows its
// own HTML card.
import { useCallback, useRef, useState } from "react";
import type { Emit } from "@/contracts";
import { useT } from "@/i18n";
import type { KindProps } from "../kinds/shared";
import g from "./games.module.css";
import { deferMount, GameStage, type MountGame } from "./GameStage";

export function SlopeRunActivity({
  activity: a,
  claims,
  prefs,
  emit,
  found = [],
}: KindProps<"slope-run">) {
  const tr = useT();
  const [done, setDone] = useState(false);
  // Read at mount (each Play): the journal's list of exhibits seen before.
  const foundRef = useRef(found);
  foundRef.current = found;
  const report: Emit = (e) => {
    if (e.type === "activity.complete") setDone(true);
    emit(e);
  };
  const mount = useCallback<MountGame>(
    (host, out) =>
      deferMount(
        import("@vendor/dont-fall-on-the-slope/src/embed").then((m) =>
          m.mountSlope(host, {
            activityId: a.id,
            prefs,
            emit: out,
            seed: a.seed,
            finds: a.finds.flatMap((f) => {
              const c = claims[f.claimId];
              if (!c) return []; // withdrawn or unknown: no find
              const cite = c.claim.citations[0];
              const src = c.sources.find((x) => x.id === cite?.sourceId);
              return [
                {
                  id: f.id,
                  label: f.label,
                  look: f.look,
                  text: c.claim.text,
                  source: src
                    ? `${src.title}${cite ? ` · ${cite.locator}` : ""}`
                    : undefined,
                },
              ];
            }),
            seen: foundRef.current,
          }),
        ),
      ),
    [a],
  );
  const seenIds = new Set(found);
  const notebook = a.finds.filter((f) => seenIds.has(f.id));
  return (
    <GameStage
      activityId={a.id}
      knowledgeId={a.knowledgeId}
      title={a.title}
      prompt={a.prompt}
      claimIds={a.claimIds}
      claims={claims}
      labels={a.illustrative ? ["Illustrative street"] : []}
      completion={a.completion}
      done={done}
      emit={report}
      mount={mount}
      fit="fill"
      preload={() =>
        Promise.all([
          import("@vendor/dont-fall-on-the-slope/src/embed"),
          import("@vendor/dont-fall-on-the-slope/src/game"),
          // Compile the physics engine now; the game's own init() call is
          // then quick (wasm-bindgen keeps the first instance).
          import("@dimforge/rapier3d-compat").then((R) => R.default.init()),
        ])
      }
      notes={
        a.finds.length > 0 && (
          <div className={g.notebook}>
            <strong>
              {tr("Street notebook: {n} of {total} seen", {
                n: notebook.length,
                total: a.finds.length,
              })}
            </strong>
            {notebook.length > 0 && (
              <span> · {notebook.map((f) => f.label).join(" · ")}</span>
            )}
          </div>
        )
      }
      controls={
        <>
          {tr(
            "← → or A D lean (tap for a small correction), ↓ or Space brace, Enter starts again. On a phone, drag sideways or use the buttons.",
          )}
        </>
      }
    />
  );
}
