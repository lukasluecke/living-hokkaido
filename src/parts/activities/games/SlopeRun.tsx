"use client";
// slope-run kind: Don't Fall on the Slope (vendor/dont-fall-on-the-slope).
// The game shows no history text yet; the cited claims are listed in the
// panel. Without WebGL the game shows its own HTML card.
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
      mountSlope(host, { activityId: a.id, prefs, emit: out, seed: a.seed }),
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
          ← → or A D lean, ↓ or Space brace, Enter starts again. On a phone,
          drag sideways or use the buttons.
        </>
      }
    />
  );
}
