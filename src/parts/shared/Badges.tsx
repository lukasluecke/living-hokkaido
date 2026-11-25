// Small labels every part must show where they apply (see docs/STYLE.md).
import type { Presentation, Representation } from "@/contracts";
import { useT } from "@/i18n";
import s from "./Fallback.module.css";

export function PresentationBadge({ value }: { value: Presentation }) {
  const t = useT();
  if (value === "approved")
    return <span className={s.badge}>{t("Reviewed")}</span>;
  if (value === "research-preview")
    return <span className={s.badge}>{t("Draft")}</span>;
  return null;
}

export function RepresentationBadge({ value }: { value: Representation }) {
  const t = useT();
  const text = {
    illustrative: "Illustrative model",
    reconstruction: "Reconstruction",
    scan: "3D scan",
  }[value];
  return <span className={s.badge}>{t(text)}</span>;
}
