import type { IssueCategory } from "./types";

// Generates a fully local, offline-safe SVG placeholder image (as a data URI)
// for demo issue photos, so the demo never depends on a third-party image CDN
// and can never be mistaken for a real citizen-submitted photo.

const CATEGORY_GLYPH: Record<IssueCategory, string> = {
  pothole: "⬤",
  garbage: "🗑",
  streetlight: "💡",
  water_leakage: "💧",
  damaged_road: "▬",
  open_manhole: "⬡",
  fallen_tree: "🌳",
  road_obstruction: "🚧",
  drainage: "〰",
  public_cleanliness: "✦",
  accessibility: "♿",
  other: "❔",
};

const CATEGORY_GRADIENT: Record<IssueCategory, [string, string]> = {
  pothole: ["#4338ca", "#0891b2"],
  garbage: ["#65a30d", "#a3a300"],
  streetlight: ["#eab308", "#f97316"],
  water_leakage: ["#0891b2", "#4f46e5"],
  damaged_road: ["#475569", "#1e293b"],
  open_manhole: ["#7c2d12", "#dc2626"],
  fallen_tree: ["#166534", "#22c55e"],
  road_obstruction: ["#ea580c", "#f97316"],
  drainage: ["#0e7490", "#164e63"],
  public_cleanliness: ["#0d9488", "#22d3ee"],
  accessibility: ["#7e22ce", "#a855f7"],
  other: ["#475569", "#64748b"],
};

export function categoryPlaceholderImage(
  category: IssueCategory,
  label: string,
  variant: "before" | "after" | "report" = "report"
): string {
  const [from, to] = CATEGORY_GRADIENT[category];
  const glyph = CATEGORY_GLYPH[category];
  const overlay =
    variant === "after"
      ? `<rect width="800" height="600" fill="#059669" opacity="0.12"/>`
      : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${from}"/>
        <stop offset="100%" stop-color="${to}"/>
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="800" height="600" fill="url(#g)"/>
    <rect width="800" height="600" fill="url(#grid)"/>
    ${overlay}
    <text x="400" y="270" font-size="140" text-anchor="middle" fill="rgba(255,255,255,0.9)">${glyph}</text>
    <text x="400" y="360" font-size="30" font-family="Arial, sans-serif" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-weight="700">${label}</text>
    <text x="400" y="400" font-size="18" font-family="Arial, sans-serif" text-anchor="middle" fill="rgba(255,255,255,0.75)" letter-spacing="2">SAMPLE / DEMO IMAGE — ${variant.toUpperCase()}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
