"use client";
// slope-run kind: Don't Fall on the Slope (vendor/dont-fall-on-the-slope).
// Finds (museum labels in the street) carry their claim's text and source
// into the game; the panel also lists every claim. Without WebGL the game
// shows its own HTML card.
import { useCallback, useState } from "react";
import type { Emit } from "@/contracts";
import { mountSlope } from "@vendor/dont-fall-on-the-slope/src/embed";
import type { KindProps } from "../kinds/shared";
import { GameStage, type MountGame } from "./GameStage";

export function SlopeRunActivity({
  activity: a,
  claims,
  prefs,
  emit,
}: KindProps<"slope-run">) {
  const [done, setDone] = useState(false);
  const report: Emit = (e) => {
    if (e.type === "activity.complete") setDone(true);
    emit(e);
  };
  const mount = useCallback<MountGame>(
    (host, out) =>
      mountSlope(host, {
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
              text: c.claim.text,
              source: src
                ? `${src.title}${cite ? ` · ${cite.locator}` : ""}`
                : undefined,
            },
          ];
        }),
      }),
    [a],
  );
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
      controls={
        <>
          ← → or A D lean (tap for a small correction), ↓ or Space brace, Enter
          starts again. On a phone, drag sideways or use the buttons.
        </>
      }
    />
  );
}
