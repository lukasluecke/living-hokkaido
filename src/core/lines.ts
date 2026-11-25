// The deadpan guide's lines. Game lines only: they joke about what just
// happened and never state history (history comes from cited claims, M3).

export const TITLE = "Don't Fall on the Slope";
export const READY_LINE = "Please do not touch the exhibits.";

const CRASH: Record<string, string> = {
  shopfront:
    "You have touched a shopfront. Visitors are asked to admire the architecture from a respectful distance.",
  "snow-pile": "You have entered a snow pile. It was not an entrance.",
  "lamp-post": "You have embraced a lamp post. The lamp post remains unmoved.",
  crate: "You have inspected a crate at speed. Its contents are unchanged.",
  bicycle:
    "You have touched a parked bicycle. It was parked, which is more than can be said for you.",
  tourist:
    "You have collided with a fellow visitor. You are now both part of the exhibit.",
};

export function crashLine(what: string | null): string {
  return (
    (what && CRASH[what]) ??
    "You have touched an exhibit. The exhibit has been informed."
  );
}

export const FINISH_LINE =
  "You have reached the canal without touching anything. Staff have been asked to remain calm.";
