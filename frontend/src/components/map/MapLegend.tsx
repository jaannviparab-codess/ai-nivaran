import { MARKER_COLORS } from "./markerColors";

const ITEMS: { key: keyof typeof MARKER_COLORS; label: string }[] = [
  { key: "critical", label: "Critical" },
  { key: "high", label: "High" },
  { key: "normal", label: "Normal" },
  { key: "resolved", label: "Resolved" },
];

export function MapLegend({ className }: { className?: string }) {
  return (
    <div className={className}>
      {ITEMS.map((item) => (
        <span key={item.key} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
          <span className="h-2.5 w-2.5 rounded-full border border-white shadow-sm" style={{ backgroundColor: MARKER_COLORS[item.key] }} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
