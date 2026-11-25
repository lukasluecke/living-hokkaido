// Original owl sketch (MIT, Living Hokkaido team). A fictional guide, not a
// spiritual representation. Simple shapes to match the low-poly island owl.
export function Owl({ speaking, size = 120 }: { speaking: boolean; size?: number }) {
  return (
    <svg
      className={`owl ${speaking ? "owl-speaking" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="Owl guide"
    >
      <ellipse cx="60" cy="112" rx="34" ry="5" fill="#000" opacity="0.18" />
      <g className="owl-body">
        <path d="M60 18 L94 40 L98 82 L60 108 L22 82 L26 40 Z" fill="#8a5a35" />
        <path d="M60 52 L84 66 L80 92 L60 104 L40 92 L36 66 Z" fill="#d9bb86" />
        <path d="M26 40 L36 22 L46 34 Z" fill="#6e4b32" />
        <path d="M94 40 L84 22 L74 34 Z" fill="#6e4b32" />
        <path d="M22 82 L14 66 L26 52 Z" fill="#6e4b32" />
        <path d="M98 82 L106 66 L94 52 Z" fill="#6e4b32" />
        <circle cx="45" cy="47" r="13" fill="#fbf4e6" />
        <circle cx="75" cy="47" r="13" fill="#fbf4e6" />
        <g className="owl-eyes">
          <circle cx="46" cy="48" r="5.5" fill="#2b2118" />
          <circle cx="74" cy="48" r="5.5" fill="#2b2118" />
          <circle cx="48" cy="46" r="1.6" fill="#fff" />
          <circle cx="76" cy="46" r="1.6" fill="#fff" />
        </g>
        <path className="owl-beak" d="M55 58 L65 58 L60 68 Z" fill="#e8c27a" />
        <path d="M50 70 l4 4 l4 -4 M62 70 l4 4 l4 -4 M56 80 l4 4 l4 -4" stroke="#c99a63" strokeWidth="2" fill="none" />
      </g>
    </svg>
  );
}
