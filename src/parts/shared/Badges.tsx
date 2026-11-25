// Small labels every part must show where they apply (see docs/STYLE.md).
import type { Presentation, Representation } from "@/contracts";
import s from "./Fallback.module.css";

export function PresentationBadge({ value }: { value: Presentation }) {
  if (value === "approved") return <span className={s.badge}>Reviewed</span>;
  if (value === "research-preview")
    return <span className={s.badge}>Research preview · review pending</span>;
  return null;
}

export function RepresentationBadge({ value }: { value: Representation }) {
  const text = {
    illustrative: "Illustrative model",
    reconstruction: "Reconstruction",
    scan: "3D scan",
  }[value];
  return <span className={s.badge}>{text}</span>;
}
