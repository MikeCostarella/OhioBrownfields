import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import { COUNTIES_GEO } from "../../data/sites";

/** Permanent county-name labels in their own click-through pane. */
export default function CountyLabels({ enabled, dark }: { enabled: boolean; dark: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (!enabled) return;
    if (!map.getPane("county-labels")) {
      const pane = map.createPane("county-labels");
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }
    const group = L.layerGroup([], { pane: "county-labels" });
    COUNTIES_GEO.features.forEach((f) => {
      const center = L.geoJSON(f).getBounds().getCenter();
      const icon = L.divIcon({
        className: "county-label" + (dark ? " on-dark" : ""),
        html: `<span>${f.properties.name}</span>`,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
      L.marker(center, { icon, interactive: false, keyboard: false, pane: "county-labels" }).addTo(group);
    });
    group.addTo(map);
    return () => { group.remove(); };
  }, [enabled, dark, map]);
  return null;
}
