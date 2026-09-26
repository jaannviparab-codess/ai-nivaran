import L from "leaflet";

export { MARKER_COLORS, markerColorFor } from "./markerColors";

export function createMarkerIcon(color: string, options?: { size?: number; pulse?: boolean; selected?: boolean }) {
  const size = options?.size ?? (options?.selected ? 26 : 18);
  const pulse = options?.pulse ?? false;
  const html = `
    <span style="position:relative;display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;">
      ${
        pulse
          ? `<span style="position:absolute;inset:0;border-radius:9999px;background:${color};opacity:0.55;animation:nvr-pulse 2s cubic-bezier(0.4,0,0.6,1) infinite;"></span>`
          : ""
      }
      <span style="position:relative;display:block;width:100%;height:100%;border-radius:9999px;background:${color};border:2.5px solid white;box-shadow:0 1px 6px rgba(15,23,42,0.45);"></span>
    </span>`;
  return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size / 2], popupAnchor: [0, -size / 2] });
}
