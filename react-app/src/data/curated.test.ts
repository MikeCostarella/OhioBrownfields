import { describe, expect, it } from "vitest";
import { CURATED } from "./curated";
import { COUNTIES_GEO, SITES } from "./sites";
import { milesBetween, pointInGeometry } from "../lib/geo";

describe("hand-picked sites", () => {
  it("has unique ids and at least one https source each", () => {
    expect(new Set(CURATED.map((c) => c.id)).size).toBe(CURATED.length);
    for (const c of CURATED) {
      expect(c.sources.length, c.id).toBeGreaterThan(0);
      for (const s of c.sources) expect(s.url, c.id).toMatch(/^https:\/\//);
    }
  });

  it("plots every site inside the county it names", () => {
    for (const c of CURATED) {
      const f = COUNTIES_GEO.features.find((x) => x.properties.name === c.county);
      expect(f, c.id).toBeDefined();
      expect(f!.properties.fips, c.id).toBe(c.fips);
      expect(pointInGeometry(c.lon, c.lat, f!.geometry), c.id).toBe(true);
    }
  });

  it("does not duplicate an EPA ACRES site (none within 0.1 mile)", () => {
    for (const c of CURATED) {
      const near = SITES.find((s) => milesBetween(c.lat, c.lon, s.lat, s.lon) < 0.1);
      expect(near?.name, c.id).toBeUndefined();
    }
  });
});
