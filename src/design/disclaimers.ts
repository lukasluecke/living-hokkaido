// One switch for the honesty labels in the visitor product.
//
// For the hackathon demo the in-app disclaimers ("Draft", "AI-generated
// model", "AI voice", "Illustrative sketch", machine-translation notes, the
// story film's retelling note, the "Model labels" switch, ...) are hidden and
// listed in one place instead: docs/PROVENANCE.md. The code stays, so the
// labels come back with one change.
//
// Turn them on: build with NEXT_PUBLIC_SHOW_DISCLAIMERS=1, or set the
// default below to true. Every new label must check SHOW_DISCLAIMERS and get
// a row in docs/PROVENANCE.md.
//
// Not gated (content, not a disclaimer): sources and locators, "How do we
// know?" and the reveal card, mode names such as "Device voice" or "Sketch",
// and attribution of a real person's words.

/** Show the in-app honesty labels. Off for the demo (docs/PROVENANCE.md). */
export const SHOW_DISCLAIMERS: boolean =
  process.env.NEXT_PUBLIC_SHOW_DISCLAIMERS === "1";

/** Model labels (chip and "About this model" note) are visible. */
export function showModelLabels(prefs: { hideModelLabels?: boolean }) {
  return SHOW_DISCLAIMERS && !prefs.hideModelLabels;
}

/**
 * The one global note that stays visible (HUD menu), so the demo is open
 * about its content while the labels are off. Details: docs/PROVENANCE.md.
 */
export const DEMO_NOTE =
  "Hackathon demo. Some models, films, voices and texts are AI-assisted or illustrative, and a curator has not checked all of them yet.";
