"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { useEffect } from "react";
import type { GeoPoint } from "@/lib/types";
import { createMarkerIcon } from "./markerIcon";

function FlyTo({ lat, lng }: GeoPoint) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 15), { duration: 0.7 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng]);
  return null;
}

function ClickToMove({ onMove }: { onMove: (pos: GeoPoint) => void }) {
  useMapEvents({
    click(e) {
      onMove({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export function DraggablePinMap({
  position,
  onChange,
  className,
}: {
  position: GeoPoint;
  onChange: (pos: GeoPoint) => void;
  className?: string;
}) {
  const icon = createMarkerIcon("#4f46e5", { size: 30 });

  return (
    <MapContainer center={[position.lat, position.lng]} zoom={16} className={className} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker
        position={[position.lat, position.lng]}
        icon={icon}
        draggable
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const pos = marker.getLatLng();
            onChange({ lat: pos.lat, lng: pos.lng });
          },
        }}
      />
      <ClickToMove onMove={onChange} />
      <FlyTo lat={position.lat} lng={position.lng} />
    </MapContainer>
  );
}
