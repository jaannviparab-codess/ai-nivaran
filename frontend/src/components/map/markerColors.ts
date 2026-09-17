import type { IssueSeverity, IssueStatus } from "@/lib/types";

// Pure color data — deliberately has NO dependency on Leaflet, so it can be
// safely imported from server-rendered components (e.g. the landing page's
// map legend) without pulling browser-only code into the SSR bundle.

export const MARKER_COLORS: Record<"critical" | "high" | "normal" | "resolved", string> = {
  critical: "#dc2626",
  high: "#d97706",
  normal: "#4f46e5",
  resolved: "#059669",
};

export function markerColorFor(severity: IssueSeverity, status: IssueStatus): string {
  if (status === "resolved" || status === "citizen_verified") return MARKER_COLORS.resolved;
  if (severity === "critical") return MARKER_COLORS.critical;
  if (severity === "high") return MARKER_COLORS.high;
  return MARKER_COLORS.normal;
}
