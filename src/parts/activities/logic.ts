// Pure activity logic (loom state, quiz score) for the weave activity. No React, so it is easy to test.
// Each row has two steps: pass the thread across, then press the row down.
// Over/under alternates per row and column (plain over-under grid). This is a
// playful illustration, not a record of a real technique.

export type LoomPhase = "pass" | "beat" | "done";

export type LoomState = {
  rows: number;
  /** Rows fully woven (passed and pressed down). */
  woven: number;
  phase: LoomPhase;
};

export type LoomAction = "pass" | "beat" | "reset";

export function startLoom(rows: number): LoomState {
  return { rows, woven: 0, phase: rows > 0 ? "pass" : "done" };
}

export function stepLoom(s: LoomState, action: LoomAction): LoomState {
  if (action === "reset") return startLoom(s.rows);
  if (action === "pass" && s.phase === "pass") return { ...s, phase: "beat" };
  if (action === "beat" && s.phase === "beat") {
    const woven = s.woven + 1;
    return { ...s, woven, phase: woven >= s.rows ? "done" : "pass" };
  }
  return s;
}

/** The thread crosses left to right on even rows and back on odd rows. */
export function passDirection(row: number): "ltr" | "rtl" {
  return row % 2 === 0 ? "ltr" : "rtl";
}

/** True where the thread lies over the warp at this row and column. */
export function isOver(row: number, column: number): boolean {
  return (row + column) % 2 === 0;
}

/** The row the visitor works on now (clamped to the last row when done). */
export function activeRow(s: LoomState): number {
  return Math.min(s.woven, s.rows - 1);
}

/** 1 on the first try, down to 0 when every wrong option was tried first. */
export function quizScore(wrongTries: number, options: number): number {
  if (options <= 1) return 1;
  return Math.max(0, 1 - wrongTries / (options - 1));
}
