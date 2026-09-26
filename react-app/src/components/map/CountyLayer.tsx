import { useMemo, useState } from "react";
import { GeoJSON, useMapEvents } from "react-leaflet";
import type L from "leaflet";
import type { Feature, Geometry } from "geojson";
import { COUNTIES_GEO, COUNT_BY_COUNTY, type CountyProps } from "../../data/sites";

/** Sites-per-county shading ramp (rust, light → dark). Mirrors the legend. */
export const SHADE_STEPS: { min: number; color: string; label: string }[] = [
  { min: 100, color: "#7f3d17", label: "100+" },
  { min: 40, color: "#b0612f", label: "40–99" },
  { min: 15, color: "#ce8c5d", label: "15–39" },
  { min: 5, color: "#e0b894", label: "5–14" },
  { min: 1, color: "#efdcc8", label: "1–4" },
  { min: 0, color: "#f4f6f8", label: "None" },
];

export function shadeFor(n: number): string {
  return (SHADE_STEPS.find((s) => n >= s.min) ?? SHADE_STEPS[SHADE_STEPS.length - 1]).color;
}

interface Props {
  shading: boolean;
  satellite: boolean;
  countyFilter: string;
  onPickCounty: (name: string) => void;
}

/** All 88 counties: outline always, optional sites-per-county shading; click to filter. */
export default function CountyLayer({ shading, satellite, countyFilter, onPickCounty }: Props) {
  // Fade the shading as you zoom in so street detail stays readable:
  // band 0 = statewide, 1 = regional, 2 = city/street level.
  const bandOf = (z: number) => (z >= 11 ? 2 : z >= 9 ? 1 : 0);
  const map = useMapEvents({ zoomend: () => setBand(bandOf(map.getZoom())) });
  const [band, setBand] = useState(() => bandOf(map.getZoom()));
  const shadeOpacity = [satellite ? 0.45 : 0.55, 0.3, 0.1][band];

  const style = useMemo(
    () => (f?: Feature<Geometry, CountyProps>): L.PathOptions => {
      const name = f?.properties.name ?? "";
      const picked = name === countyFilter;
      const n = COUNT_BY_COUNTY[name] ?? 0;
      return {
        color: picked ? "#ffb300" : satellite ? "#ffffff" : "#5b7488",
        weight: picked ? 3 : 1,
        opacity: picked ? 1 : 0.8,
        fillColor: shading ? shadeFor(n) : "#ffffff",
        fillOpacity: shading ? shadeOpacity : 0,
      };
    },
    [shading, satellite, countyFilter, shadeOpacity],
  );

  const onEach = useMemo(
    () => (f: Feature<Geometry, CountyProps>, layer: L.Layer) => {
      const name = f.properties.name;
      const n = COUNT_BY_COUNTY[name] ?? 0;
      layer.bindTooltip(`<b>${name} County</b><br>${n} brownfield site${n === 1 ? "" : "s"}`, { sticky: true });
      const path = layer as L.Path;
      layer.on("mouseover", () => path.setStyle({ weight: name === countyFilter ? 3 : 2.5 }));
      layer.on("mouseout", () => path.setStyle(style(f)));
      layer.on("click", () => onPickCounty(name));
    },
    [countyFilter, onPickCounty, style],
  );

  // react-leaflet's GeoJSON only re-runs style/onEachFeature when recreated.
  const key = `${shading}|${satellite}|${countyFilter}|${band}`;
  return <GeoJSON key={key} data={COUNTIES_GEO} style={style as L.StyleFunction} onEachFeature={onEach as never} />;
}
