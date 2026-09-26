import { describe, expect, it } from "vitest";
import { milesBetween, pointInGeometry } from "./geo";
import { COUNTIES_GEO, SITES } from "../data/sites";

describe("geo", () => {
  it("measures Youngstown to Cleveland at about 65 miles", () => {
    const d = milesBetween(41.0998, -80.6495, 41.4993, -81.6944);
    expect(d).toBeGreaterThan(55);
    expect(d).toBeLessThan(65);
  });

  it("places downtown Warren in Trumbull County", () => {
    const hit = COUNTIES_GEO.features.find((f) => pointInGeometry(-80.8184, 41.2376, f.geometry));
    expect(hit?.properties.name).toBe("Trumbull");
  });

  it("agrees with the county assigned to every committed site", () => {
    const byName = Object.fromEntries(COUNTIES_GEO.features.map((f) => [f.properties.name, f]));
    const misses = SITES.filter((s) => !pointInGeometry(s.lon, s.lat, byName[s.county].geometry));
    // The only sites outside their assigned county are shoreline/river-edge
    // points that fall outside every county polygon and were snapped to the
    // nearest one; none may sit inside a DIFFERENT county.
    for (const s of misses) {
      const inside = COUNTIES_GEO.features.find((f) => pointInGeometry(s.lon, s.lat, f.geometry));
      expect(inside, `${s.id} ${s.name}`).toBeUndefined();
    }
    expect(misses.length).toBeLessThan(SITES.length * 0.02);
  });
});
