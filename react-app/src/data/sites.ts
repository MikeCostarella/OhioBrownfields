import snapshot from "./sites.json";
import countiesGeo from "./ohio-counties.json";
import type { FeatureCollection, Geometry } from "geojson";
import type { Site, SiteSnapshot } from "../types/site";

const SNAP = snapshot as SiteSnapshot;

/** Every Ohio ACRES brownfield property, sorted by county then name. */
export const SITES: Site[] = SNAP.sites;

/** When the committed snapshot was pulled from EPA (ISO string). */
export const RETRIEVED: string = SNAP.retrieved;

export interface CountyProps {
  name: string;
  fips: string;
}

/**
 * Static committed snapshot of all 88 Ohio county boundaries (U.S. Census
 * cartographic boundary file), used for drawing, shading, and the offline
 * point-in-polygon county assignment done by scripts/fetch-acres.mjs.
 */
export const COUNTIES_GEO = countiesGeo as FeatureCollection<Geometry, CountyProps>;

/** All 88 county names, A→Z. */
export const COUNTY_NAMES: string[] = COUNTIES_GEO.features
  .map((f) => f.properties.name)
  .sort((a, b) => a.localeCompare(b));

export const FIPS_BY_COUNTY: Record<string, string> = Object.fromEntries(
  COUNTIES_GEO.features.map((f) => [f.properties.name, f.properties.fips]),
);

/** Site count per county name (all 88 keys present, zero-filled). */
export const COUNT_BY_COUNTY: Record<string, number> = (() => {
  const m: Record<string, number> = Object.fromEntries(COUNTY_NAMES.map((n) => [n, 0]));
  for (const s of SITES) m[s.county] = (m[s.county] ?? 0) + 1;
  return m;
})();

export const COUNTIES_WITH_SITES = Object.values(COUNT_BY_COUNTY).filter((n) => n > 0).length;

/** Records whose EPA-typed county disagrees with the mapped location. */
export function hasCountyMismatch(s: Site): boolean {
  return s.epaCounty.trim().toLowerCase() !== s.county.toLowerCase();
}

/** Link to the site's EPA Facility Registry Service detail page. */
export function frsUrl(s: Site): string {
  return `https://ofmpub.epa.gov/frs_public2/fii_query_detail.disp_program_facility?p_registry_id=${encodeURIComponent(s.frs)}`;
}

export function googleMapsUrl(s: Site): string {
  return `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lon}`;
}

export function directionsUrl(s: Site): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lon}`;
}

/** Title-case EPA's ALL-CAPS names for display, keeping short words and codes sensible. */
export function displayName(raw: string): string {
  if (!raw) return raw;
  const letters = raw.replace(/[^A-Za-z]/g, "");
  if (letters && letters !== letters.toUpperCase()) return raw; // already mixed case
  const small = new Set(["of", "and", "the", "at", "on", "in", "for", "to", "a", "an"]);
  return raw
    .toLowerCase()
    .split(/(\s+|-|\/|\()/)
    .map((w, i) => {
      if (!w.trim() || /^[-/(]$/.test(w)) return w;
      if (i > 0 && small.has(w)) return w;
      if (/^(i{1,3}|iv|vi{0,3}|llc|inc|usa|us|ne|nw|se|sw|gm|cod|ii)$/i.test(w)) return w.toUpperCase();
      if (/^mc[a-z]/.test(w)) return "Mc" + w.charAt(2).toUpperCase() + w.slice(3);
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join("");
}
