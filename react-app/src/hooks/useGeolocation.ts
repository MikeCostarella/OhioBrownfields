import { useCallback, useRef, useState } from "react";

export type GeoStatus = "idle" | "locating" | "refining" | "ready" | "denied" | "unavailable";

export interface GeoState {
  status: GeoStatus;
  position: { lat: number; lon: number; accuracy: number } | null;
}

/**
 * Two-stage geolocation (fleet convention): a fast coarse fix first so the map
 * can move right away, then a high-accuracy GPS refine that replaces it.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>({ status: "idle", position: null });
  const run = useRef(0);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setState({ status: "unavailable", position: null });
      return;
    }
    const id = ++run.current;
    setState((s) => ({ ...s, status: "locating" }));
    const ok = (refined: boolean) => (p: GeolocationPosition) => {
      if (id !== run.current) return;
      setState({
        status: refined ? "ready" : "refining",
        position: { lat: p.coords.latitude, lon: p.coords.longitude, accuracy: p.coords.accuracy },
      });
    };
    const fail = (refined: boolean) => (e: GeolocationPositionError) => {
      if (id !== run.current) return;
      if (e.code === e.PERMISSION_DENIED) setState({ status: "denied", position: null });
      else if (refined) setState((s) => ({ ...s, status: s.position ? "ready" : "unavailable" }));
    };
    navigator.geolocation.getCurrentPosition(ok(false), fail(false), {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 5 * 60 * 1000,
    });
    navigator.geolocation.getCurrentPosition(ok(true), fail(true), {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 0,
    });
  }, []);

  const clear = useCallback(() => {
    run.current++;
    setState({ status: "idle", position: null });
  }, []);

  return { ...state, locate, clear };
}
