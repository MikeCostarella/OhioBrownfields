import { MapContainer } from "react-leaflet";
import type L from "leaflet";
import "leaflet/dist/leaflet.css";
import BaseMapLayers from "../vendor/basemaps/BaseMapLayers";
import { CARTO_VOYAGER } from "../vendor/basemaps/basemaps";
import type { TileSpec } from "../vendor/basemaps/basemaps";
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

// Streets keeps the app's own attribution suffix for the site data source.
const STREETS: TileSpec = {
  ...CARTO_VOYAGER,
  attribution: CARTO_VOYAGER.attribution + " · Sites: US EPA ACRES",
};

export default function SiteMap(p: Props) {
  const sat = p.basemap !== "streets";
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
      {/* CARTO Voyager streets, or OSIP aerial (+ CARTO labels for hybrid);
          see vendor/basemaps. Moves maxZoom with the choice (aerial to 21). */}
      <BaseMapLayers baseMap={p.basemap} streets={STREETS} streetsLabels={null} />
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
