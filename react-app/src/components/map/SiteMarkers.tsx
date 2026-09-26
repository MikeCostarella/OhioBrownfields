import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { Site } from "../../types/site";
import { displayName } from "../../data/sites";

interface Props {
  sites: Site[];
  onSelect: (id: string) => void;
}

function radiusFor(zoom: number): number {
  return zoom < 7.5 ? 4 : zoom < 9 ? 5 : zoom < 12 ? 6.5 : 8;
}

/**
 * Every visible site as a canvas-rendered circle marker (fast for ~1,800
 * points). Hover shows the name; click selects the site. Managed imperatively
 * so filtering doesn't churn thousands of React components.
 */
export default function SiteMarkers({ sites, onSelect }: Props) {
  const map = useMap();
  const renderer = useRef<L.Canvas | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    if (!map.getPane("sites")) {
      const pane = map.createPane("sites");
      pane.style.zIndex = "460";
    }
    renderer.current = L.canvas({ padding: 0.4, pane: "sites" });
    layer.current = L.layerGroup().addTo(map);
    return () => { layer.current?.remove(); };
  }, [map]);

  useEffect(() => {
    const g = layer.current;
    if (!g) return;
    g.clearLayers();
    const r = radiusFor(map.getZoom());
    for (const s of sites) {
      const m = L.circleMarker([s.lat, s.lon], {
        renderer: renderer.current ?? undefined,
        pane: "sites",
        radius: r,
        color: "#ffffff",
        weight: 1.3,
        fillColor: "#b5541c",
        fillOpacity: 0.92,
      });
      m.bindTooltip(`<b>${displayName(s.name)}</b><br>${s.city} · ${s.county} Co.`, { direction: "top", offset: [0, -4] });
      m.on("click", () => onSelectRef.current(s.id));
      g.addLayer(m);
    }
  }, [sites, map]);

  useEffect(() => {
    const onZoom = () => {
      const r = radiusFor(map.getZoom());
      layer.current?.eachLayer((l) => (l as L.CircleMarker).setRadius(r));
    };
    map.on("zoomend", onZoom);
    return () => { map.off("zoomend", onZoom); };
  }, [map]);

  return null;
}
