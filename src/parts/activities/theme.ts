// Turns design tokens into CSS custom properties for the activity panel.
import type { CSSProperties } from "react";
import { type Season4, season, ui } from "@/design/tokens";

function rgb(hex: string): [number, number, number] {
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Blend four season colours with weights that sum to 1. */
export function blendSeason(colors: Season4, weights: readonly number[]) {
  const out = [0, 1, 2].map((k) =>
    Math.round(colors.reduce((sum, c, i) => sum + rgb(c)[k] * weights[i], 0)),
  );
  return `rgb(${out.join(" ")})`;
}

export function themeVars(weights: readonly number[]): CSSProperties {
  return {
    "--lh-paper": ui.paper,
    "--lh-paper-edge": ui.paperEdge,
    "--lh-ink": ui.ink,
    "--lh-ink-soft": ui.inkSoft,
    "--lh-gold": ui.gold,
    "--lh-gold-deep": ui.goldDeep,
    "--lh-danger": ui.danger,
    "--lh-sky": blendSeason(season.sky, weights),
    "--lh-ground": blendSeason(season.ground, weights),
    "--lh-accent": blendSeason(season.accent, weights),
  } as CSSProperties;
}
