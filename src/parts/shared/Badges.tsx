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

export function RepresentationBadge({
  value,
  generated = false,
}: {
  value: Representation;
  /** An AI-generated model is shown (never a scan or a reconstruction). */
  generated?: boolean;
}) {
  const t = useT();
  if (generated)
    return <span className={s.badge}>{t("AI-generated model")}</span>;
  const text = {
    illustrative: "Illustrative model",
    reconstruction: "Reconstruction",
    scan: "3D scan",
  }[value];
  return <span className={s.badge}>{t(text)}</span>;
}
