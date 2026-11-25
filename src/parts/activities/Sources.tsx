// Footnotes: the claims an activity is grounded in, with source and locator.
import type { ResolvedClaim } from "@/contracts";
import s from "./Activities.module.css";

export function Sources({
  ids,
  claims,
}: {
  ids: string[];
  claims: Record<string, ResolvedClaim>;
}) {
  const list = ids.flatMap((id) => (claims[id] ? [claims[id]] : []));
  if (list.length === 0) return null;
  return (
    <details className={s.sources}>
      <summary>How do we know?</summary>
      <ul>
        {list.map(({ claim, sources }) => (
          <li key={claim.id}>
            <span>{claim.text}</span>
            {claim.citations.map((c) => {
              const src = sources.find((x) => x.id === c.sourceId);
              return (
                <small key={`${c.sourceId}-${c.locator}`}>
                  {src ? src.attribution || src.title : c.sourceId}
                  {c.locator ? ` · ${c.locator}` : ""}
                </small>
              );
            })}
          </li>
        ))}
      </ul>
    </details>
  );
}
