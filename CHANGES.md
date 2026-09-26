# Changes

## 2026-09-26 — Hand-picked sites

- New hand-picked layer (teal diamonds) with 12 well-known former industrial
  sites that aren't in EPA ACRES: McDonald Steel, Niles Generating Station,
  Warren Steel/Copperweld, Campbell Works (Casey Drive), Republic Steel
  (Lorain, Canton), Avon Lake, Eastlake and Lake Shore power plants, Cleveland
  Thermal, Westinghouse (Mansfield), and W.C. Beckjord.
- Each has status, summary, owner, acreage, cleanup/funding program, and cited
  sources; data lives in `src/data/curated-sites.json`.
- Sidebar section, detail dialog, View → Hand-picked Sites cards, Layers
  toggle, legend entry, stats count, and CSV export include them.
- Tests: every entry inside its county, has https sources, and isn't within
  0.1 mile of an ACRES site.

## 2026-09-26 — Initial release

- New fleet app: interactive map + directory of all 1,776 EPA ACRES brownfield
  properties in Ohio (74 of 88 counties).
- Map with CARTO Voyager / Esri satellite basemaps, county outlines, and
  sites-per-county shading that fades at street zoom.
- Search (name, address, city, ZIP, ACRES ID), county filter (list or map
  click), Near-me distance sort with two-stage geolocation.
- Site detail dialog with copyable IDs/coordinates, Google Maps, Directions,
  EPA facility record, and Suggest an edit (config/contact.ts).
- Sites Table (sortable) and County Summary views; CSV export of the current
  filter (UTF-8 BOM, RFC-4180).
- Hamburger accordion main menu (View, Basemap, Layers, Tools, Data Sources,
  My Ohio Pages, Links) and footer build timestamp.
- `npm run data` refresh script (EPA query + point-in-polygon county
  assignment); vitest coverage for geo and CSV helpers.
