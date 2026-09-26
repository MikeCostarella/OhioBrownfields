import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { CuratedSite } from "../../types/site";

interface Props {
  sites: CuratedSite[];
  onSelect: (id: string) => void;
}

/** Hand-picked sites as teal diamond pins, drawn above the ACRES dots. */
export default function CuratedMarkers({ sites, onSelect }: Props) {
  const map = useMap();
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!map.getPane("curated")) {
      const pane = map.createPane("curated");
      pane.style.zIndex = "620";
    }
    const icon = L.divIcon({ className: "curated-pin", html: "<span></span>", iconSize: [18, 18], iconAnchor: [9, 9] });
    const group = L.layerGroup(
      sites.map((c) =>
        L.marker([c.lat, c.lon], { icon, pane: "curated", title: c.name, riseOnHover: true })
          .bindTooltip(`<b>${c.name}</b><br>${c.city} · ${c.county} Co.<br><i>Hand-picked site</i>`, {
            direction: "top",
            offset: [0, -8],
          })
          .on("click", () => onSelectRef.current(c.id)),
      ),
    ).addTo(map);
    return () => { group.remove(); };
  }, [sites, map]);

  return null;
}
