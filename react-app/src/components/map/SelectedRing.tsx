import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/** Pulsing amber highlight ring on the selected site (fleet convention). */
export default function SelectedRing({ lat, lon }: { lat: number | null; lon: number | null }) {
  const map = useMap();
  useEffect(() => {
    if (lat === null || lon === null) return;
    const icon = L.divIcon({
      className: "pulse-ring",
      html: "<span></span><span></span>",
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });
    const m = L.marker([lat, lon], { icon, interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map);
    return () => { m.remove(); };
  }, [lat, lon, map]);
  return null;
}
