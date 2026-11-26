// Events between parts. Parts never call each other. A part emits an event;
// the shell updates ExperienceState and the journal, then passes new props.
// Add an event = additive contract change. Never change an existing payload.
import { z } from "zod";
import { activityResultSchema } from "./activity";
import { idSchema } from "./ids";

const e = <T extends string, S extends z.ZodRawShape>(type: T, shape: S) =>
  z.object({ type: z.literal(type), ...shape });

export const experienceEventSchema = z.discriminatedUnion("type", [
  // Island
  e("location.select", { locationId: idSchema }),
  e("owl.arrived", { locationId: idSchema }),
  /** Fly to a highlight's place and open it on arrival (additive). */
  e("highlight.open", { highlightId: idSchema }),
  // Detail scene
  e("scene.enter", { sceneId: idSchema }),
  e("scene.ready", { sceneId: idSchema }),
  e("scene.exit", { sceneId: idSchema }),
  /** The scene's story film was opened / closed or ended (additive). */
  e("film.open", { sceneId: idSchema }),
  e("film.close", { sceneId: idSchema }),
  // Artifacts
  e("artifact.focus", { artifactId: idSchema }),
  e("artifact.inspected", { artifactId: idSchema }),
  e("hotspot.open", { artifactId: idSchema, hotspotId: idSchema }),
  e("artifact.blur", {}),
  // Activities
  e("activity.start", { activityId: idSchema }),
  e("activity.complete", { result: activityResultSchema }),
  e("activity.close", { activityId: idSchema }),
  // Journal
  e("journal.open", {}),
  e("journal.close", {}),
  e("stamp.earned", { stampId: idSchema }),
  // Seasons
  e("season.set", { value: z.number().min(0).lt(4) }),
  e("season.play", { playing: z.boolean() }),
  // Generated model or code sketch on object cards and in rooms
  e("models.set", { sketch: z.boolean() }),
  e("models.labels", { hidden: z.boolean() }),
  // Reveal ("how this was made")
  e("reveal.open", {
    knowledgeId: idSchema,
    claimId: idSchema.optional(),
    artifactId: idSchema.optional(),
  }),
  e("reveal.close", {}),
  // Over time (timeline part)
  e("timeline.open", { timelineId: idSchema }),
  e("timeline.era", { timelineId: idSchema, eraId: idSchema }),
  e("timeline.close", { timelineId: idSchema }),
  // Global
  e("nav.back", {}),
]);
export type ExperienceEvent = z.infer<typeof experienceEventSchema>;
export type EventType = ExperienceEvent["type"];
export type EventOf<T extends EventType> = Extract<
  ExperienceEvent,
  { type: T }
>;
export type Emit = (event: ExperienceEvent) => void;

/** Tiny typed event bus. No dependencies; works in labs and tests. */
export function createEventBus() {
  const listeners = new Set<(event: ExperienceEvent) => void>();
  return {
    emit(event: ExperienceEvent) {
      for (const l of listeners) l(event);
    },
    on(listener: (event: ExperienceEvent) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
