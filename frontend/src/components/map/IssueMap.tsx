"use client";

import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { DEFAULT_MAP_CENTER } from "@/lib/constants";
import type { IssueListItem } from "@/lib/types";
import { createMarkerIcon, markerColorFor } from "./markerIcon";
import { MapPopup } from "./MapPopup";

export interface IssueMapProps {
  issues: IssueListItem[];
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  heatmap?: boolean;
  selectedId?: string;
  scrollWheelZoom?: boolean;
}

function densityCells(issues: IssueListItem[], cellSize = 0.01) {
  const cells = new Map<string, { lat: number; lng: number; count: number }>();
  for (const issue of issues) {
    const key = `${Math.round(issue.location.lat / cellSize)}_${Math.round(issue.location.lng / cellSize)}`;
    const existing = cells.get(key);
    if (existing) {
      existing.count += 1;
      existing.lat = (existing.lat + issue.location.lat) / 2;
      existing.lng = (existing.lng + issue.location.lng) / 2;
    } else {
      cells.set(key, { lat: issue.location.lat, lng: issue.location.lng, count: 1 });
    }
  }
  return Array.from(cells.values());
}

export function IssueMap({
  issues,
  center = DEFAULT_MAP_CENTER,
  zoom = 12,
  className,
  heatmap = false,
  selectedId,
  scrollWheelZoom = true,
}: IssueMapProps) {
  const cells = heatmap ? densityCells(issues) : [];
  const maxCount = Math.max(1, ...cells.map((c) => c.count));

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      scrollWheelZoom={scrollWheelZoom}
      className={className}
      attributionControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {heatmap
        ? cells.map((cell, i) => (
            <CircleMarker
              key={i}
              center={[cell.lat, cell.lng]}
              radius={12 + (cell.count / maxCount) * 26}
              pathOptions={{
                color: "transparent",
                fillColor: "#dc2626",
                fillOpacity: 0.12 + (cell.count / maxCount) * 0.35,
              }}
            />
          ))
        : issues.map((issue) => {
            const color = markerColorFor(issue.severity, issue.status);
            return (
              <Marker
                key={issue.id}
                position={[issue.location.lat, issue.location.lng]}
                icon={createMarkerIcon(color, {
                  selected: issue.id === selectedId,
                  pulse: issue.severity === "critical" && issue.status !== "resolved",
                })}
              >
                <Popup minWidth={248} maxWidth={248}>
                  <MapPopup issue={issue} />
                </Popup>
              </Marker>
            );
          })}
    </MapContainer>
  );
}
