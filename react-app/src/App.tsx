import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import MainMenu, { type AppView } from "./components/MainMenu";
import { useBaseMap } from "./vendor/basemaps/useBaseMap";
import SiteMap from "./components/SiteMap";
import SiteList from "./components/SiteList";
import SiteTable from "./components/SiteTable";
import CountyTable from "./components/CountyTable";
import SiteDetail from "./components/SiteDetail";
import AboutDialog from "./components/AboutDialog";
import CuratedDetail from "./components/CuratedDetail";
import CuratedView from "./components/CuratedView";
import BuildStamp from "./components/BuildStamp";
import { SHADE_STEPS } from "./components/map/CountyLayer";
import {
  COUNTIES_GEO,
  COUNTIES_WITH_SITES,
  COUNTY_NAMES,
  COUNT_BY_COUNTY,
  SITES,
} from "./data/sites";
import { CURATED, CURATED_BY_ID, curatedMatches } from "./data/curated";
import { milesBetween } from "./lib/geo";
import { downloadCsv, toCsv } from "./lib/csv";
import { useGeolocation } from "./hooks/useGeolocation";
import type { Site } from "./types/site";

const SITE_BY_ID: Record<string, Site> = Object.fromEntries(SITES.map((s) => [s.id, s]));

export default function App() {
  const [view, setView] = useState<AppView>("map");
  const [mobilePane, setMobilePane] = useState<"map" | "list">("map");
  const [query, setQuery] = useState("");
  const [county, setCounty] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [basemap, setBasemap] = useBaseMap();
  const [shading, setShading] = useState(true);
  const [labels, setLabels] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [curatedOn, setCuratedOn] = useState(true);
  const [curatedSel, setCuratedSel] = useState<string | null>(null);
  const [curatedOpen, setCuratedOpen] = useState(false);
  const [curatedListOpen, setCuratedListOpen] = useState(true);
  const mapRef = useRef<L.Map | null>(null);
  const geo = useGeolocation();

  const handleMapRef = useCallback((m: L.Map) => {
    mapRef.current = m;
  }, []);

  // Leaflet caches its container size; re-measure whenever the map is shown again.
  useEffect(() => {
    if (view !== "map") return;
    const t = setTimeout(() => mapRef.current?.invalidateSize(), 80);
    return () => clearTimeout(t);
  }, [view, mobilePane]);

  const distances = useMemo(() => {
    if (!nearMe || !geo.position) return null;
    const { lat, lon } = geo.position;
    return Object.fromEntries(SITES.map((s) => [s.id, milesBetween(lat, lon, s.lat, s.lon)]));
  }, [nearMe, geo.position]);

  const filtered = useMemo(() => {
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = SITES.filter((s) => {
      if (county && s.county !== county) return false;
      if (!terms.length) return true;
      const hay = `${s.name} ${s.address} ${s.city} ${s.zip} ${s.id} ${s.county}`.toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
    if (distances) list.sort((a, b) => distances[a.id] - distances[b.id]);
    return list;
  }, [query, county, distances]);

  const filteredCurated = useMemo(() => {
    if (!curatedOn) return [];
    const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const list = CURATED.filter((c) => curatedMatches(c, terms, county));
    if (nearMe && geo.position) {
      const { lat, lon } = geo.position;
      list.sort((a, b) => milesBetween(lat, lon, a.lat, a.lon) - milesBetween(lat, lon, b.lat, b.lon));
    }
    return list;
  }, [curatedOn, query, county, nearMe, geo.position]);

  const selected = selectedId ? SITE_BY_ID[selectedId] ?? null : null;
  const selectedCurated = curatedSel ? CURATED_BY_ID[curatedSel] ?? null : null;
  const ringAt = selected ?? selectedCurated;

  const fitOhio = useCallback(() => {
    const b = L.geoJSON(COUNTIES_GEO).getBounds();
    mapRef.current?.flyToBounds(b, { padding: [20, 20], duration: 0.6 });
  }, []);

  const flyToCounty = useCallback((name: string) => {
    const f = COUNTIES_GEO.features.find((x) => x.properties.name === name);
    if (!f || !mapRef.current) return;
    mapRef.current.flyToBounds(L.geoJSON(f).getBounds(), { padding: [40, 40], maxZoom: 11, duration: 0.6 });
  }, []);

  const pickCounty = useCallback(
    (name: string) => {
      setCounty(name);
      setView("map");
      setMobilePane("map");
      if (name) setTimeout(() => flyToCounty(name), 120);
      else fitOhio();
    },
    [flyToCounty, fitOhio],
  );

  // Selecting from the map or list opens the detail dialog without moving the map.
  const selectSite = useCallback((id: string) => {
    setCuratedSel(null);
    setSelectedId(id);
    setDetailOpen(true);
  }, []);

  const selectCurated = useCallback((id: string) => {
    setSelectedId(null);
    setCuratedSel(id);
    setCuratedOpen(true);
  }, []);

  const zoomToCurated = useCallback((id: string) => {
    const c = CURATED_BY_ID[id];
    if (!c) return;
    setSelectedId(null);
    setCuratedSel(id);
    setCuratedOpen(false);
    setView("map");
    setMobilePane("map");
    setTimeout(() => {
      mapRef.current?.invalidateSize();
      mapRef.current?.flyTo([c.lat, c.lon], Math.max(mapRef.current.getZoom(), 15), { duration: 0.7 });
    }, 120);
  }, []);

  const zoomToSite = useCallback((id: string) => {
    const s = SITE_BY_ID[id];
    if (!s) return;
    setCuratedSel(null);
    setSelectedId(id);
    setDetailOpen(false);
    setView("map");
    setMobilePane("map");
    setTimeout(() => {
      mapRef.current?.invalidateSize();
      mapRef.current?.flyTo([s.lat, s.lon], Math.max(mapRef.current.getZoom(), 16), { duration: 0.7 });
    }, 120);
  }, []);

  const showOnMap = useCallback(
    (id: string) => {
      zoomToSite(id);
      setTimeout(() => setDetailOpen(true), 900);
    },
    [zoomToSite],
  );

  const findNearMe = useCallback(() => {
    setNearMe(true);
    setCounty("");
    setView("map");
    geo.locate();
  }, [geo]);

  // When a fix lands (coarse first, then GPS refine), frame you and the nearest sites.
  useEffect(() => {
    if (!nearMe || !geo.position || !mapRef.current) return;
    const { lat, lon } = geo.position;
    const nearest = [...SITES]
      .sort((a, b) => milesBetween(lat, lon, a.lat, a.lon) - milesBetween(lat, lon, b.lat, b.lon))
      .slice(0, 5);
    const b = L.latLngBounds([[lat, lon], ...nearest.map((s) => [s.lat, s.lon] as [number, number])]);
    mapRef.current.flyToBounds(b, { padding: [50, 50], maxZoom: 14, duration: 0.7 });
  }, [nearMe, geo.position]);

  const exportCsv = useCallback(() => {
    const header = [
      "Dataset", "ACRES ID", "Site Name", "Address", "City", "County", "ZIP", "Latitude", "Longitude",
      "County in EPA Record", "FRS Registry ID", "Geocode Method", "Accuracy (m)", "Last Reported", "Added to FRS", "HUC-8",
      "Former Use", "Status", "Sources",
    ];
    const rows: unknown[][] = filtered.map((s) => [
      "EPA ACRES", s.id, s.name, s.address, s.city, s.county, s.zip, s.lat, s.lon,
      s.epaCounty, s.frs, s.method, s.accuracyM ?? "", s.reported, s.added, s.huc8,
      "", "", "",
    ]);
    for (const c of filteredCurated) {
      rows.push([
        "Hand-picked", "", c.name, c.address, c.city, c.county, "", c.lat, c.lon,
        "", "", c.locationPrecision === "approximate" ? "Approximate location" : "Street address", "", "", "", "",
        c.formerUse, c.status, c.sources.map((s) => s.url).join(" "),
      ]);
    }
    const scope = county ? county.replace(/\s+/g, "") + "County" : "Ohio";
    downloadCsv(`${scope}_Brownfields_ACRES.csv`, toCsv(header, rows));
  }, [filtered, filteredCurated, county]);

  const clearFilters = () => {
    setQuery("");
    setNearMe(false);
    geo.clear();
    pickCounty("");
  };

  const geoMsg =
    geo.status === "locating" ? "Finding your location…" :
    geo.status === "refining" ? "Refining your location…" :
    geo.status === "denied" ? "Location permission was denied. Allow it in your browser to sort by distance." :
    geo.status === "unavailable" ? "Your location isn't available on this device." : null;

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-left">
          <MainMenu
            view={view}
            onViewChange={setView}
            basemap={basemap}
            onSetBasemap={setBasemap}
            shading={shading}
            onToggleShading={() => setShading((v) => !v)}
            labels={labels}
            onToggleLabels={() => setLabels((v) => !v)}
            curatedOn={curatedOn}
            onToggleCurated={() => setCuratedOn((v) => !v)}
            curatedCount={CURATED.length}
            onNearMe={findNearMe}
            onExportCsv={exportCsv}
            exportCount={filtered.length + filteredCurated.length}
            onFitOhio={() => { setView("map"); setMobilePane("map"); setTimeout(fitOhio, 120); }}
            onAbout={() => setAboutOpen(true)}
          />
          <div>
            <h1>&#127981; Ohio Brownfields</h1>
            <div className="sub">Every EPA ACRES brownfield property in Ohio, plus hand-picked sites</div>
          </div>
        </div>
        <div className="credit">Created by: Mike Costarella</div>
      </header>

      <div className="stats">
        <span><b>{SITES.length.toLocaleString()}</b> brownfield sites</span>
        <span><b>{COUNTIES_WITH_SITES}</b> of 88 counties</span>
        <span className="stat-curated">
          <i className="diamond" aria-hidden="true" /> <b>{CURATED.length}</b> hand-picked
        </span>
        <span>
          Showing <b>{filtered.length.toLocaleString()}</b>
          {curatedOn && filteredCurated.length ? <> + <b>{filteredCurated.length}</b> hand-picked</> : null}
          {county ? <> in <b>{county} County</b></> : null}
          {nearMe && geo.position ? <>, nearest first</> : null}
        </span>
        {(county || query || nearMe) && (
          <button type="button" className="stats-clear" onClick={clearFilters}>Clear filters</button>
        )}
      </div>

      {view === "map" && (
        <div className="view-toggle" role="tablist" aria-label="Map or list">
          <button type="button" className={mobilePane === "map" ? "active" : ""} onClick={() => setMobilePane("map")}>Map</button>
          <button type="button" className={mobilePane === "list" ? "active" : ""} onClick={() => setMobilePane("list")}>
            List ({(filtered.length + filteredCurated.length).toLocaleString()})
          </button>
        </div>
      )}

      <div className={"body view-" + view + " pane-" + mobilePane}>
        <aside className="sidebar">
          <div className="search-row">
            <input
              type="search"
              placeholder="Search site, address, city, ZIP or ACRES ID…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search brownfield sites"
            />
            <div className="filter-row">
              <select value={county} onChange={(e) => pickCounty(e.target.value)} aria-label="Filter by county">
                <option value="">All counties</option>
                {COUNTY_NAMES.map((n) => (
                  <option key={n} value={n} disabled={COUNT_BY_COUNTY[n] === 0}>
                    {n} ({COUNT_BY_COUNTY[n]})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className={"chip" + (nearMe ? " active" : "")}
                onClick={() => (nearMe ? (setNearMe(false), geo.clear()) : findNearMe())}
                title="Sort by distance from your location"
              >
                &#9678; Near me
              </button>
            </div>
            {geoMsg && <div className="geo-msg">{geoMsg}</div>}
          </div>
          {filteredCurated.length > 0 && (
            <div className="curated-section">
              <button
                type="button"
                className="curated-head"
                aria-expanded={curatedListOpen}
                onClick={() => setCuratedListOpen((v) => !v)}
              >
                <span>
                  <i className="diamond" aria-hidden="true" /> Hand-picked sites ({filteredCurated.length})
                </span>
                <span aria-hidden="true">{curatedListOpen ? "▾" : "▸"}</span>
              </button>
              {curatedListOpen &&
                filteredCurated.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={"site-row curated-row" + (c.id === curatedSel ? " is-selected" : "")}
                    onClick={() => {
                      selectCurated(c.id);
                      if (mapRef.current && mobilePane === "map") mapRef.current.panTo([c.lat, c.lon]);
                    }}
                  >
                    <span className="sr-main">
                      <span className="sr-name">{c.name}</span>
                      <span className="sr-addr">
                        {c.city} · {c.county} Co. · {c.formerUse.split(" (")[0]}
                      </span>
                    </span>
                  </button>
                ))}
            </div>
          )}
          <SiteList
            sites={filtered}
            query={query}
            selectedId={selectedId}
            distances={distances}
            onSelect={(id) => {
              selectSite(id);
              const s = SITE_BY_ID[id];
              if (s && mapRef.current && mobilePane === "map") mapRef.current.panTo([s.lat, s.lon]);
            }}
          />
        </aside>

        <div className="map-wrap">
          <SiteMap
            sites={filtered}
            selected={ringAt}
            curated={filteredCurated}
            onSelectCurated={selectCurated}
            basemap={basemap}
            shading={shading}
            labels={labels}
            countyFilter={county}
            you={geo.position}
            onSelect={selectSite}
            onPickCounty={(n) => pickCounty(n === county ? "" : n)}
            onMapRef={handleMapRef}
          />
          <button className="locate-btn" title="Find sites near me" aria-label="Find sites near me" onClick={findNearMe}>
            &#9678;
          </button>
          <div className="legend">
            {shading && (
              <>
                <div className="lg-title">Sites per county</div>
                {SHADE_STEPS.map((s) => (
                  <div className="lg-row" key={s.label}>
                    <span className="sw" style={{ background: s.color }} /> {s.label}
                  </div>
                ))}
              </>
            )}
            <div className="lg-row" style={shading ? { marginTop: 6 } : undefined}>
              <span className="sw sw-dot" /> Brownfield site
            </div>
            {curatedOn && (
              <div className="lg-row">
                <span className="sw sw-diamond" /> Hand-picked site
              </div>
            )}
            {ringAt && (
              <div className="lg-row">
                <span className="sw sw-ring" /> Selected
              </div>
            )}
          </div>
        </div>

        {view === "table" && (
          <SiteTable sites={filtered} query={query} onShowOnMap={showOnMap} onExportCsv={exportCsv} />
        )}
        {view === "counties" && <CountyTable onPickCounty={pickCounty} />}
        {view === "curated" && (
          <CuratedView
            sites={CURATED.filter((c) => curatedMatches(c, query.trim().toLowerCase().split(/\s+/).filter(Boolean), county))}
            total={CURATED.length}
            query={query}
            onOpen={selectCurated}
            onShowOnMap={(id) => { if (!curatedOn) setCuratedOn(true); zoomToCurated(id); }}
          />
        )}
      </div>

      <BuildStamp />

      <SiteDetail
        site={detailOpen ? selected : null}
        you={geo.position}
        onClose={() => setDetailOpen(false)}
        onZoom={zoomToSite}
      />
      <CuratedDetail
        site={curatedOpen ? selectedCurated : null}
        you={geo.position}
        onClose={() => setCuratedOpen(false)}
        onZoom={zoomToCurated}
      />
      <AboutDialog open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
