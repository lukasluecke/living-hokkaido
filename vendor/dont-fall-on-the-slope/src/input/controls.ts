// Turns raw input into the two things the player controls: lean (-1..1) and
// brace. Pure, so keyboard, buttons and drag all combine the same way.

export type Held = {
  left: boolean;
  right: boolean;
  brace: boolean;
};

export type Controls = { lean: number; brace: boolean };

/** Pixels of horizontal drag for a full lean. */
export const DRAG_FULL = 70;

export function controlsFrom(held: Held, dragPx: number | null): Controls {
  let lean = (held.right ? 1 : 0) - (held.left ? 1 : 0);
  if (dragPx !== null) lean += dragPx / DRAG_FULL;
  return { lean: Math.max(-1, Math.min(1, lean)), brace: held.brace };
}
