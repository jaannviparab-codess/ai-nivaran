"use client";

import { Info, LocateFixed, MapPin } from "lucide-react";
import { useEffect } from "react";
import { DraggablePinMapLoader } from "@/components/map/DraggablePinMapLoader";
import { useGeolocation } from "@/lib/hooks/useGeolocation";
import { DEFAULT_MAP_CENTER } from "@/lib/constants";
import type { IssueLocation } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function LocationPicker({
  value,
  onChange,
}: {
  value: IssueLocation;
  onChange: (location: IssueLocation) => void;
}) {
  const geo = useGeolocation();

  function handleUseMyLocation() {
    geo.locate();
  }

  useEffect(() => {
    if (geo.status === "success" && geo.lat != null && geo.lng != null) {
      onChange({ ...value, lat: geo.lat, lng: geo.lng });
    }
    // Only react to a fresh geolocation fix, not to every `value`/`onChange` identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo.status, geo.lat, geo.lng]);

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-xl bg-primary-50 p-3 text-xs text-primary-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          We use your location only to pinpoint this report on the map — it’s never shared publicly beyond an
          approximate pin, and you can adjust it manually before submitting.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Drag the pin or tap the map to set the exact spot</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUseMyLocation}
          loading={geo.status === "locating"}
          leftIcon={<LocateFixed className="h-4 w-4" />}
        >
          Use my location
        </Button>
      </div>

      <div className="h-72 overflow-hidden rounded-2xl border border-border">
        <DraggablePinMapLoader
          position={{ lat: value.lat || DEFAULT_MAP_CENTER.lat, lng: value.lng || DEFAULT_MAP_CENTER.lng }}
          onChange={(pos) => onChange({ ...value, lat: pos.lat, lng: pos.lng })}
          className="h-full w-full"
        />
      </div>

      {geo.errorMessage && <p className="text-xs text-warning-600">{geo.errorMessage}</p>}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <MapPin className="h-3.5 w-3.5" />
        {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="ward" className="mb-1 block text-xs font-medium text-slate-600">
            Ward / Area
          </label>
          <input
            id="ward"
            value={value.ward || ""}
            onChange={(e) => onChange({ ...value, ward: e.target.value })}
            placeholder="e.g. Kothrud"
            className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          />
        </div>
        <div>
          <label htmlFor="landmark" className="mb-1 block text-xs font-medium text-slate-600">
            Nearby landmark (optional)
          </label>
          <input
            id="landmark"
            value={value.landmark || ""}
            onChange={(e) => onChange({ ...value, landmark: e.target.value })}
            placeholder="e.g. Near XYZ School"
            className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          />
        </div>
      </div>
    </div>
  );
}
