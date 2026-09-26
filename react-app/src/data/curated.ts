import list from "./curated-sites.json";
import type { CuratedSite } from "../types/site";

/**
 * Hand-picked brownfields: well-known former industrial sites that are not in
 * EPA's ACRES list (usually because cleanup was privately funded or state-only).
 * Edit src/data/curated-sites.json to add or update entries — cite sources.
 */
export const CURATED: CuratedSite[] = (list as CuratedSite[])
  .slice()
  .sort((a, b) => a.county.localeCompare(b.county) || a.name.localeCompare(b.name));

export const CURATED_BY_ID: Record<string, CuratedSite> = Object.fromEntries(CURATED.map((c) => [c.id, c]));

export function curatedMatches(c: CuratedSite, terms: string[], county: string): boolean {
  if (county && c.county !== county) return false;
  if (!terms.length) return true;
  const hay = `${c.name} ${c.address} ${c.city} ${c.county} ${c.formerUse} ${c.owner ?? ""}`.toLowerCase();
  return terms.every((t) => hay.includes(t));
}
