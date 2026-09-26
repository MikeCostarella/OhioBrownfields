import { MapContainer, TileLayer } from "react-leaflet";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { CuratedSite, Site } from "../types/site";
import type { Basemap } from "./MainMenu";
import { COUNTIES_GEO } from "../data/sites";
import CountyLayer from "./map/CountyLayer";
import CountyLabels from "./map/CountyLabels";
import SiteMarkers from "./map/SiteMarkers";
import CuratedMarkers from "./map/CuratedMarkers";
import SelectedRing from "./map/SelectedRing";
import YouAreHere from "./map/YouAreHere";
import FitOhio from "./map/FitOhio";
import ExposeMap from "./map/ExposeMap";

interface Props {
  sites: Site[];
  selected: { lat: number; lon: number } | null;
  curated: CuratedSite[];
  onSelectCurated: (id: string) => void;
  basemap: Basemap;
  shading: boolean;
  labels: boolean;
  countyFilter: string;
  you: { lat: number; lon: number; accuracy: number } | null;
  onSelect: (id: string) => void;
  onPickCounty: (name: string) => void;
  onMapRef: (m: L.Map) => void;
}

const OHIO_CENTER: [number, number] = [40.3, -82.7];

export default function SiteMap(p: Props) {
  const sat = p.basemap === "satellite";
  return (
    <MapContainer
      center={OHIO_CENTER}
      zoom={7}
      zoomSnap={0.25}
      zoomDelta={0.5}
      minZoom={6}
      maxZoom={19}
      style={{ height: "100%", width: "100%" }}
    >
      {sat ? (
        <TileLayer
          key="sat"
          attribution="Imagery &copy; Esri, Maxar, Earthstar Geographics"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={19}
        />
      ) : (
        <TileLayer
          key="std"
          // CARTO raster basemaps require a (free) API key as of Aug 2026 —
          // tiles without one are watermarked "API KEY REQUIRED". The key is
          // rate-limited and shared across the fleet's apps.
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a> · Sites: US EPA ACRES'
          url={"https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=cb1_2mty_1_1564a95dd2e80809e16b1914"}
          subdomains="abcd"
          maxZoom={19}
        />
      )}
      <CountyLayer shading={p.shading} satellite={sat} countyFilter={p.countyFilter} onPickCounty={p.onPickCounty} />
      <CountyLabels enabled={p.labels} dark={sat} />
      <SiteMarkers sites={p.sites} onSelect={p.onSelect} />
      <CuratedMarkers sites={p.curated} onSelect={p.onSelectCurated} />
      <SelectedRing lat={p.selected?.lat ?? null} lon={p.selected?.lon ?? null} />
      <YouAreHere pos={p.you} />
      <FitOhio data={COUNTIES_GEO} />
      <ExposeMap onMapRef={p.onMapRef} />
    </MapContainer>
  );
}
