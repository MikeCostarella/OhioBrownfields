/** One EPA ACRES brownfield property (one row of src/data/sites.json). */
export interface Site {
  /** ACRES property ID (EPA program system ID). */
  id: string;
  /** EPA Facility Registry Service (FRS) registry ID. */
  frs: string;
  name: string;
  address: string;
  city: string;
  /** County assigned by point-in-polygon on the site's coordinates. */
  county: string;
  /** 5-digit county FIPS for `county`. */
  fips: string;
  zip: string;
  lat: number;
  lon: number;
  /** County exactly as typed in EPA's record (may disagree with `county`). */
  epaCounty: string;
  /** How EPA geocoded the site (e.g. "Address Matching-House Number"). */
  method: string;
  /** Reported horizontal accuracy in meters (null if unknown). */
  accuracyM: number | null;
  /** Date the record was added to FRS (YYYY-MM-DD). */
  added: string;
  /** Date ACRES last reported the record to FRS (YYYY-MM-DD). */
  reported: string;
  /** 8-digit USGS hydrologic unit (watershed) code. */
  huc8: string;
}

export interface SiteSnapshot {
  source: string;
  /** ISO timestamp of when the snapshot was pulled from EPA. */
  retrieved: string;
  count: number;
  sites: Site[];
}

/** A cited source for a hand-picked site. */
export interface CuratedSource {
  title: string;
  publisher: string;
  /** YYYY-MM-DD, YYYY-MM, or null when the page is undated. */
  date: string | null;
  url: string;
}

/**
 * A hand-picked former industrial site that is widely described as a
 * brownfield but is NOT in EPA's ACRES list (one row of
 * src/data/curated-sites.json). Every fact here comes from `sources`.
 */
export interface CuratedSite {
  /** Stable slug, e.g. "mcdonald-steel". */
  id: string;
  name: string;
  address: string;
  city: string;
  county: string;
  fips: string;
  lat: number;
  lon: number;
  /** "address" = geocoded street address; "approximate" = plotted at the property's general location. */
  locationPrecision: "address" | "approximate";
  formerUse: string;
  acres: number | null;
  owner: string | null;
  /** One sentence on current status as of the latest source. */
  status: string;
  summary: string;
  /** Cleanup / funding program named in the sources, if any. */
  program: string | null;
  sources: CuratedSource[];
  /** Date this entry was last checked against its sources (YYYY-MM-DD). */
  reviewed: string;
}
