// Refresh src/data/sites.json from EPA's ACRES layer.
//
//   cd react-app
//   npm run data
//
// Source: EPA Facility Registry Service map layer of ACRES brownfield
// properties, filtered to Ohio:
//   https://geodata.epa.gov/arcgis/rest/services/OEI/FRS_INTERESTS/MapServer/0
//
// Each site's county is assigned by point-in-polygon against the committed
// county boundaries (src/data/ohio-counties.json), because the county typed
// into EPA's records is wrong for a couple dozen sites. The county EPA typed is
// kept as `epaCounty` so the app can flag disagreements.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(here, "..", "src", "data");
const SERVICE = "https://geodata.epa.gov/arcgis/rest/services/OEI/FRS_INTERESTS/MapServer/0/query";
const FIELDS = [
  "PGM_SYS_ID", "REGISTRY_ID", "PRIMARY_NAME", "LOCATION_ADDRESS", "CITY_NAME", "COUNTY_NAME",
  "POSTAL_CODE", "LATITUDE83", "LONGITUDE83", "ACCURACY_VALUE", "COLLECT_MTH_DESC",
  "CREATE_DATE", "LAST_REPORTED_DATE", "HUC8_CODE",
];
const PAGE = 2000;

// ---- point-in-polygon (same algorithm as src/lib/geo.ts) ----
function inRing(x, y, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function inGeom(x, y, g) {
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  return polys.some((r) => inRing(x, y, r[0]) && !r.slice(1).some((h) => inRing(x, y, h)));
}
// Distance (degrees) from a point to the nearest polygon edge, for sites that
// sit just outside a boundary on a river or lakeshore.
function edgeDist(x, y, g) {
  let best = Infinity;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
  for (const rings of polys) for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [x1, y1] = ring[j];
      const [x2, y2] = ring[i];
      const dx = x2 - x1, dy = y2 - y1;
      const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
      best = Math.min(best, Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)));
    }
  }
  return best;
}

const counties = JSON.parse(readFileSync(join(DATA_DIR, "ohio-counties.json"), "utf8")).features;
function countyOf(lon, lat) {
  const hit = counties.find((f) => inGeom(lon, lat, f.geometry));
  if (hit) return hit.properties;
  let best = null, bestD = Infinity;
  for (const f of counties) {
    const d = edgeDist(lon, lat, f.geometry);
    if (d < bestD) { bestD = d; best = f.properties; }
  }
  return bestD < 0.02 ? best : null; // ~1.3 miles
}

const day = (ms) => (ms ? new Date(ms).toISOString().slice(0, 10) : "");
const clean = (s) => (s ?? "").toString().trim();
const title = (s) =>
  clean(s)
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bMc([a-z])/g, (_, c) => "Mc" + c.toUpperCase());

async function fetchAll() {
  const rows = [];
  for (let offset = 0; ; offset += PAGE) {
    const qs = new URLSearchParams({
      where: "STATE_CODE='OH'",
      outFields: FIELDS.join(","),
      returnGeometry: "false",
      orderByFields: "OBJECTID",
      resultOffset: String(offset),
      resultRecordCount: String(PAGE),
      f: "json",
    });
    const res = await fetch(`${SERVICE}?${qs}`);
    if (!res.ok) throw new Error(`EPA service returned HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`EPA service error: ${JSON.stringify(json.error)}`);
    rows.push(...json.features.map((f) => f.attributes));
    process.stdout.write(`  fetched ${rows.length}\r`);
    if (!json.exceededTransferLimit && json.features.length < PAGE) break;
  }
  process.stdout.write("\n");
  return rows;
}

const raw = await fetchAll();
const seen = new Set();
const sites = [];
let outside = 0;
for (const a of raw) {
  const id = clean(a.PGM_SYS_ID);
  if (!id || seen.has(id) || a.LATITUDE83 == null || a.LONGITUDE83 == null) continue;
  seen.add(id);
  const lat = +a.LATITUDE83.toFixed(5);
  const lon = +a.LONGITUDE83.toFixed(5);
  const c = countyOf(lon, lat);
  if (!c) { outside++; continue; }
  sites.push({
    id,
    frs: clean(a.REGISTRY_ID),
    name: clean(a.PRIMARY_NAME),
    address: clean(a.LOCATION_ADDRESS),
    city: title(a.CITY_NAME),
    county: c.name,
    fips: c.fips,
    zip: clean(a.POSTAL_CODE).slice(0, 5),
    lat,
    lon,
    epaCounty: title(clean(a.COUNTY_NAME).replace(/\s+COUNTY$/i, "")),
    method: title(a.COLLECT_MTH_DESC),
    accuracyM: a.ACCURACY_VALUE ?? null,
    added: day(a.CREATE_DATE),
    reported: day(a.LAST_REPORTED_DATE),
    huc8: clean(a.HUC8_CODE),
  });
}
sites.sort((x, y) => x.county.localeCompare(y.county) || x.name.localeCompare(y.name));

const out = {
  source: "US EPA ACRES via FRS_INTERESTS MapServer/0 (STATE_CODE=OH)",
  retrieved: new Date().toISOString(),
  count: sites.length,
  sites,
};
writeFileSync(join(DATA_DIR, "sites.json"), JSON.stringify(out));
const mismatch = sites.filter((s) => s.epaCounty.toLowerCase() !== s.county.toLowerCase()).length;
console.log(
  `Wrote ${sites.length} sites to src/data/sites.json` +
    ` (${new Set(sites.map((s) => s.county)).size} counties, ${mismatch} county mismatches` +
    (outside ? `, ${outside} skipped outside Ohio` : "") + ").",
);
