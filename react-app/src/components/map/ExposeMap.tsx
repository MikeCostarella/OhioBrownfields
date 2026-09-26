import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type L from "leaflet";

/** Hands the Leaflet map instance up to the parent (for fly-to, zoom tracking). */
export default function ExposeMap({ onMapRef }: { onMapRef?: (m: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { onMapRef?.(map); }, [map, onMapRef]);
  return null;
}
