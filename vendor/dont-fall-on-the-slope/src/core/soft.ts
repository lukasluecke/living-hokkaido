// Obstacle kinds you can plough through (physics makes them sensors).
import type { ObstacleKind } from "./track";

export const SOFT_KINDS: ReadonlySet<ObstacleKind> = new Set(["snow-pile"]);
