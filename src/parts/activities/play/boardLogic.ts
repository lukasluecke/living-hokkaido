// Pure rules for the stick game on a 田 grid (Hokkaido Museum, Q021): the
// lines of 田 cross at 3 × 3 points. Each side stands three sticks on its
// own edge and, in turn, moves one stick one step forward, back, left or
// right onto a free point. The first side to line up all its sticks on the
// other edge wins. No React.

export type Side = "you" | "owl";
export type Board = readonly (Side | null)[];
export type Move = { from: number; to: number };

export const SIZE = 3;
const at = (r: number, c: number) => r * SIZE + c;

/** You start on the bottom edge, the owl on the top edge. */
export function startBoard(): Board {
  return Array.from({ length: SIZE * SIZE }, (_, i) =>
    i < SIZE ? "owl" : i >= SIZE * (SIZE - 1) ? "you" : null,
  );
}

export const other = (s: Side): Side => (s === "you" ? "owl" : "you");

/** Row the side must fill to win. */
export const goalRow = (s: Side) => (s === "you" ? 0 : SIZE - 1);

export function neighbours(i: number): number[] {
  const r = Math.floor(i / SIZE);
  const c = i % SIZE;
  const out: number[] = [];
  if (r > 0) out.push(at(r - 1, c));
  if (r < SIZE - 1) out.push(at(r + 1, c));
  if (c > 0) out.push(at(r, c - 1));
  if (c < SIZE - 1) out.push(at(r, c + 1));
  return out;
}

export function movesFor(b: Board, s: Side): Move[] {
  const out: Move[] = [];
  b.forEach((v, from) => {
    if (v !== s) return;
    for (const to of neighbours(from))
      if (b[to] === null) out.push({ from, to });
  });
  return out;
}

export function isLegal(b: Board, s: Side, m: Move): boolean {
  return movesFor(b, s).some((x) => x.from === m.from && x.to === m.to);
}

export function apply(b: Board, m: Move): Board {
  const next = [...b];
  next[m.to] = next[m.from];
  next[m.from] = null;
  return next;
}

export function winner(b: Board): Side | null {
  for (const s of ["you", "owl"] as const) {
    const r = goalRow(s);
    if ([0, 1, 2].every((c) => b[at(r, c)] === s)) return s;
  }
  return null;
}

/** Steps all of a side's sticks still need, ignoring blocking. */
export function distance(b: Board, s: Side): number {
  let d = 0;
  b.forEach((v, i) => {
    if (v === s) d += Math.abs(Math.floor(i / SIZE) - goalRow(s));
  });
  return d;
}

/**
 * A gentle owl: it wins when it can, does not hand you a win in one move
 * when it can avoid it, and otherwise steps closer to its goal, with a
 * little chance so games differ. It does not look further ahead.
 */
export function owlMove(
  b: Board,
  rand: () => number = Math.random,
): Move | null {
  const moves = movesFor(b, "owl");
  if (moves.length === 0) return null;
  const scored = moves.map((m) => {
    const n = apply(b, m);
    if (winner(n) === "owl") return { m, score: -100 };
    const givesWin = movesFor(n, "you").some(
      (x) => winner(apply(n, x)) === "you",
    );
    return {
      m,
      score: distance(n, "owl") + (givesWin ? 50 : 0) + rand() * 1.5,
    };
  });
  scored.sort((x, y) => x.score - y.score);
  return scored[0].m;
}

export type Game = {
  board: Board;
  turn: Side;
  winner: Side | null;
  moves: number;
};

export const startGame = (): Game => ({
  board: startBoard(),
  turn: "you",
  winner: null,
  moves: 0,
});

/** Play a move for the side whose turn it is. Illegal moves are ignored. */
export function play(g: Game, m: Move): Game {
  if (g.winner || !isLegal(g.board, g.turn, m)) return g;
  const board = apply(g.board, m);
  const w = winner(board);
  let turn = other(g.turn);
  // A side with no move passes.
  if (!w && movesFor(board, turn).length === 0) turn = g.turn;
  return { board, turn, winner: w, moves: g.moves + 1 };
}
