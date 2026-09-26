# Ohio Brownfields

An interactive map and directory of every **EPA ACRES brownfield property in
Ohio** — 1,776 sites across 74 of Ohio's 88 counties. Built as a React +
TypeScript + Vite PWA and deployed to GitHub Pages.

**Live site:** https://mikecostarella.github.io/OhioBrownfields/

Created by Mike Costarella, Costarella Innovations, LLC.

## What it does

- **Map** of every site (canvas-rendered markers) over the CARTO Voyager or Esri
  satellite basemap, with all 88 county outlines and optional
  **sites-per-county shading** that fades as you zoom in to street level.
- **Search** by site name, address, city, ZIP, or ACRES ID, and **filter by
  county** (pick from the list or click a county on the map).
- **Site details** dialog: address, county, ACRES and FRS IDs (copyable),
  coordinates, geocode method and accuracy, watershed (HUC-8), dates, and
  buttons for Google Maps, Directions, the EPA facility record, and
  *Suggest an edit*. A pulsing amber ring marks the selected site.
- **Near me**: two-stage geolocation (coarse, then GPS refine) sorts the list by
  distance and frames you with the nearest sites.
- **Sites Table** (sortable) and **County Summary** (all 88 counties with counts,
  share, and bars) views.
- **Hand-picked sites** (teal diamonds): well-known former industrial sites that
  aren't in ACRES, such as the McDonald Steel mill and the Niles, Lake Shore,
  Eastlake and Avon Lake power plants. Each shows status, owner, acreage, any
  cleanup/funding program, and its cited news/government sources. Toggle under
  Layers; browse them all under View → Hand-picked Sites.
- **CSV export** of whatever is currently filtered, ACRES plus hand-picked
  (UTF-8 BOM, RFC-4180).
- Fleet **hamburger accordion menu** (View, Basemap, Layers, Tools, Data
  Sources, My Ohio Pages, Links) and a **build timestamp** in the footer.
- Installable PWA; basemap tiles are runtime-cached.

## Data

| What | Source |
|---|---|
| Brownfield sites | U.S. EPA **ACRES** (Assessment, Cleanup and Redevelopment Exchange System) via the Facility Registry Service layer `geodata.epa.gov/arcgis/rest/services/OEI/FRS_INTERESTS/MapServer/0`, filtered to `STATE_CODE='OH'` |
| County boundaries | U.S. Census cartographic boundary file, committed as `react-app/src/data/ohio-counties.json` |

ACRES lists properties where a grantee used EPA Brownfields funding
(assessment, cleanup, revolving loan). It is **not** every contaminated or
vacant property in Ohio — Ohio EPA's Voluntary Action Program, the Ohio
Department of Development's Brownfield Remediation Program, and BUSTR track
sites separately.

Each site's county is assigned by **point-in-polygon** against the committed
county boundaries. EPA's own county field disagrees for 22 records (one says
"Milwaukee"); those keep EPA's value as `epaCounty` and show a note in the
details dialog.

### Hand-picked sites

`react-app/src/data/curated-sites.json` holds the hand-picked list. To add a
site, copy an existing entry and fill in every field from its sources:

- `id` — unique slug; `county`/`fips` must match where `lat`/`lon` falls.
- `locationPrecision` — `"address"` if geocoded from a street address,
  `"approximate"` if plotted at the property's general location.
- `sources` — at least one https link (title, publisher, date).
- `reviewed` — the date you last checked it against the sources.

`npm test` checks that every entry sits inside its county, has sources, and
isn't within 0.1 mile of an ACRES site (so it doesn't duplicate one). Six
candidates were dropped for that reason: Peerless-Winsmith, Miller-Holzwarth,
Doehler-Jarvis, Dayton Tire & Rubber, Mohawk/Beckett Paper, and the
Youngstown Flea building are all already in ACRES. `npm run data` never touches
this file.

`SourceData/acres_oh_raw_2026-09-26.json` is the raw EPA pull the first
snapshot was built from.

### Refreshing the data

```
cd C:\projects\OhioBrownfields\react-app
npm run data
```

This queries EPA, re-assigns counties, and rewrites `src/data/sites.json`.
Commit and push to redeploy.

## Project layout

```
OhioBrownfields/
├─ .github/workflows/deploy.yml   GitHub Pages deploy (builds react-app/)
├─ SourceData/                    Raw EPA pull (reference)
└─ react-app/
   ├─ scripts/fetch-acres.mjs     npm run data — refresh the snapshot from EPA
   └─ src/
      ├─ data/sites.json          ACRES snapshot (1,776 Ohio sites)
      ├─ data/ohio-counties.json  88 county boundaries
      ├─ data/sites.ts            Loaders, county counts, link helpers
      ├─ data/curated-sites.json  Hand-picked (non-ACRES) sites with sources
      ├─ data/curated.ts          Hand-picked loader + search
      ├─ config/contact.ts        "Suggest an edit" recipient
      ├─ lib/                     CSV + geo helpers (with tests)
      ├─ hooks/useGeolocation.ts  Two-stage geolocation
      └─ components/              Menu, map layers, list, tables, dialogs
```

## Develop & build

```
cd C:\projects\OhioBrownfields\react-app
npm install
npm run dev        # local dev server
npm test           # vitest
npm run build      # tsc -b && vite build -> dist/
```

Pushing to `main` triggers the GitHub Pages deploy workflow. Set
Settings → Pages → Source to "GitHub Actions" once.
