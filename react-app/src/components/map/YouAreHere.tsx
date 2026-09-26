import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/** Blue "you are here" dot with an accuracy halo. */
export default function YouAreHere({ pos }: { pos: { lat: number; lon: number; accuracy: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (!pos) return;
    const g = L.layerGroup([
      L.circle([pos.lat, pos.lon], {
        radius: Math.min(pos.accuracy, 5000),
        color: "#2e7dbe",
        weight: 1,
        fillColor: "#5bc4f5",
        fillOpacity: 0.12,
        interactive: false,
      }),
      L.circleMarker([pos.lat, pos.lon], {
        radius: 7,
        color: "#ffffff",
        weight: 2.5,
        fillColor: "#2e7dbe",
        fillOpacity: 1,
      }).bindTooltip("You are here"),
    ]).addTo(map);
    return () => { g.remove(); };
  }, [pos, map]);
  return null;
}
