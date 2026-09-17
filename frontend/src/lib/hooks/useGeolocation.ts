"use client";

import { useCallback, useState } from "react";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  status: "idle" | "locating" | "success" | "error" | "unsupported";
  errorMessage: string | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    status: "idle",
    errorMessage: null,
  });

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, status: "unsupported", errorMessage: "Geolocation is not supported by this browser." }));
      return;
    }
    setState((s) => ({ ...s, status: "locating", errorMessage: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          status: "success",
          errorMessage: null,
        });
      },
      (err) => {
        setState((s) => ({
          ...s,
          status: "error",
          errorMessage:
            err.code === err.PERMISSION_DENIED
              ? "Location permission denied. You can still drop the pin manually on the map."
              : "Could not detect your location. Please set it manually on the map.",
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { ...state, locate };
}
