"use client";
// hide-seek kind: Out of Place (vendor/out-of-place). Our props in, the
// game's mount API out. The game validates the activity and its claims at
// its own boundary and reports only through emit.
import { useCallback, useState } from "react";
import type { Emit } from "@/contracts";
import { useT } from "@/i18n";
import type { KindProps } from "../kinds/shared";
import { deferMount, GameStage, type MountGame } from "./GameStage";
import { SHOW_DISCLAIMERS } from "@/design/disclaimers";

export function HideSeekActivity({
  activity: a,
  claims,
  prefs,
  emit,
}: KindProps<"hide-seek">) {
  const tr = useT();
  const [done, setDone] = useState(false);
  const report: Emit = (e) => {
    if (e.type === "activity.complete") setDone(true);
    emit(e);
  };
  // Mounted once per Play; the game keeps the props it was given.
  const mount = useCallback<MountGame>(
    (host, out) =>
      deferMount(
        import("@vendor/out-of-place/src/embed").then((m) =>
          m.mountOutOfPlace(host, { activity: a, claims, prefs, emit: out }),
        ),
      ),
    // claims and prefs are read at mount time on purpose (see GameStage).
    [a],
  );
  const labels = [
    "Two players · one device",
    ...(SHOW_DISCLAIMERS && a.illustrative ? ["Illustrative scene"] : []),
  ];
  return (
    <GameStage
      activityId={a.id}
      knowledgeId={a.knowledgeId}
      title={a.title}
      prompt={a.prompt}
      claimIds={a.claimIds}
      claims={claims}
      labels={labels}
      completion={a.completion}
      done={done}
      emit={report}
      mount={mount}
      fit="wide"
      preload={() =>
        Promise.all([
          import("@vendor/out-of-place/src/embed"),
          import("phaser"),
          import("@vendor/out-of-place/src/scenes/GameScene"),
          import("@vendor/out-of-place/src/scenes/SelectScene"),
        ])
      }
      controls={
        <>
          {tr(
            "Mouse, touch or keyboard. Hide: arrows move, E picks a colour, F fills, Z undoes, 1–4 pose. Seek: arrows and Space. Enter goes on.",
          )}
        </>
      }
    />
  );
}
