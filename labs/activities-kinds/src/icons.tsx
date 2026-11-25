// Original, illustrative object icons (MIT, Living Hokkaido team). Not museum
// objects and not copies of Ainu patterns: plain shapes only.
import { material } from "@/design/tokens";

export function ObjectIcon({ id, size = 72 }: { id: string; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 80 80", "aria-hidden": true };
  if (id === "fiber")
    return (
      <svg {...common}>
        <rect x="14" y="58" width="52" height="10" rx="3" fill={material.bark} />
        {[22, 30, 38, 46, 54].map((x, i) => (
          <path key={x} d={`M${x} 58 C ${x - 6 + i * 2} 40, ${x + 8} 28, ${x - 2} 12`} stroke={material.fiber} strokeWidth="4" fill="none" strokeLinecap="round" />
        ))}
        <rect x="18" y="36" width="44" height="6" rx="3" fill={material.tie} />
      </svg>
    );
  if (id === "cloth")
    return (
      <svg {...common}>
        <rect x="10" y="12" width="60" height="56" rx="4" fill={material.wood} />
        <rect x="16" y="18" width="48" height="44" fill={material.cloth} />
        {[0, 1, 2, 3, 4, 5].map((r) => (
          <rect key={r} x="16" y={20 + r * 7} width="48" height="3" fill={material.thread} opacity={r % 2 ? 0.9 : 0.55} />
        ))}
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="8" y="14" width="64" height="5" rx="2" fill={material.wood} />
      <path d="M22 18 L58 18 L62 66 L18 66 Z" fill={material.cloth} />
      <path d="M22 18 L8 34 L16 40 L24 30 Z M58 18 L72 34 L64 40 L56 30 Z" fill={material.cloth} />
      <rect x="18" y="60" width="44" height="6" fill={material.band} />
      <path d="M40 18 L40 66" stroke={material.woodDark} strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
