"use client";

import { useCallback, useState } from "react";

interface GeolocationState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  status: "idle" | "locating" | "success" | "error" | "unsupported";
  errorMessage: string | null;
  /** Stable reason code so the UI can show a translated message; errorMessage stays for backward compatibility. */
  errorCode: "unsupported" | "denied" | "failed" | null;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    lat: null,
    lng: null,
    accuracy: null,
    status: "idle",
    errorMessage: null,
    errorCode: null,
  });

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState((s) => ({ ...s, status: "unsupported", errorMessage: "Geolocation is not supported by this browser.", errorCode: "unsupported" }));
      return;
    }
    setState((s) => ({ ...s, status: "locating", errorMessage: null, errorCode: null }));
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          status: "success",
          errorMessage: null,
          errorCode: null,
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
          errorCode: err.code === err.PERMISSION_DENIED ? "denied" : "failed",
        }));
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { ...state, locate };
}
