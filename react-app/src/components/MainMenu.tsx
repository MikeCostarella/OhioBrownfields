import { useEffect, useRef, useState, type ReactNode } from "react";
import { BASE_MAP_IDS, BASE_MAP_LABELS } from "../vendor/basemaps/basemaps";
import type { BaseMapId } from "../vendor/basemaps/basemaps";

export type AppView = "map" | "table" | "counties" | "curated";
// Base map choice comes from the shared fleet library (Streets / Aerial /
// Aerial + labels); re-exported under the name this app has always used.
export type Basemap = BaseMapId;

const GITHUB_REPO_URL = "https://github.com/MikeCostarella/OhioBrownfields";
const MY_WEBSITE_URL = "https://mikecostarella.github.io/MyWebSite/";
const STATEHOUSE_HOME_URL = "https://mikecostarella.github.io/StatehouseHome/";

// Statewide "State of Ohio" projects, surfaced as their own menu section.
const OHIO_PAGES: { label: string; url: string }[] = [
  { label: "Brownfields", url: "https://mikecostarella.github.io/OhioBrownfields/" },
  { label: "Counties Hub", url: "https://mikecostarella.github.io/OhioCounties/" },
  { label: "Data Centers", url: "https://mikecostarella.github.io/OhioDataCenters/" },
  { label: "Income Tax Map", url: "https://mikecostarella.github.io/OhioIncomeTaxes/" },
  { label: "Learning Institutions", url: "https://mikecostarella.github.io/OhioLearningInstitutions/" },
  { label: "Public Libraries", url: "https://mikecostarella.github.io/OhioLibraries/" },
  { label: "Public Water Systems", url: "https://mikecostarella.github.io/OhioPublicWaterSystems/" },
].sort((a, b) => a.label.localeCompare(b.label));

// Where the data comes from, and the programs that fund brownfield cleanup.
const DATA_LINKS: { label: string; url: string }[] = [
  { label: "EPA Brownfields Program", url: "https://www.epa.gov/brownfields" },
  { label: "EPA Brownfields Near You", url: "https://www.epa.gov/brownfields/brownfields-near-you" },
  { label: "ACRES dataset (Data.gov)", url: "https://catalog.data.gov/dataset/acres-brownfields-properties" },
  { label: "EPA source map service", url: "https://geodata.epa.gov/arcgis/rest/services/OEI/FRS_INTERESTS/MapServer/0" },
  { label: "Ohio EPA — DERR", url: "https://epa.ohio.gov/divisions-and-offices/environmental-response-revitalization" },
  { label: "Ohio Brownfield Remediation Program", url: "https://development.ohio.gov/community/redevelopment/brownfield-remediation" },
];

interface Props {
  view: AppView;
  onViewChange: (v: AppView) => void;
  basemap: Basemap;
  onSetBasemap: (b: Basemap) => void;
  shading: boolean;
  onToggleShading: () => void;
  labels: boolean;
  onToggleLabels: () => void;
  curatedOn: boolean;
  onToggleCurated: () => void;
  curatedCount: number;
  onNearMe: () => void;
  onExportCsv: () => void;
  exportCount: number;
  onFitOhio: () => void;
  onAbout: () => void;
}

/**
 * Hamburger accordion menu (left of the title). Sections: View, Basemap,
 * Layers, Tools, Data Sources, My Ohio Pages, and Links. Each section header is
 * a collapsible toggle; the collapsed set persists while the app is open.
 * Opens on click; closes on outside click / Escape. Layer toggles keep the menu
 * open so several can be flipped at once.
 */
export default function MainMenu(p: Props) {
  const [open, setOpen] = useState(false);
  // Open compact by default: every section collapsed except "View".
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(["Basemap", "Layers", "Tools", "Data Sources", "My Ohio Pages", "Links"]),
  );
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggleSection = (name: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });

  const act = (fn: () => void) => () => {
    fn();
    setOpen(false);
  };

  // Collapsible section: a toggle header + its items (hidden when collapsed).
  const Section = ({ title, children }: { title: string; children: ReactNode }) => {
    const isOpen = !collapsed.has(title);
    return (
      <>
        <button
          type="button"
          className="menu-section-label menu-section-toggle"
          aria-expanded={isOpen}
          onClick={() => toggleSection(title)}
        >
          <span>{title}</span>
          <span className="menu-chevron" aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
        </button>
        {isOpen && children}
      </>
    );
  };

  const Radio = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button
      type="button"
      role="menuitemradio"
      aria-checked={on}
      className={`menu-item${on ? " active" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  const Check = ({ on, label, onClick }: { on: boolean; label: string; onClick: () => void }) => (
    <button
      type="button"
      role="menuitemcheckbox"
      aria-checked={on}
      className={`menu-item${on ? " active" : ""}`}
      onClick={onClick}
    >
      {on ? "✓ " : ""}
      {label}
    </button>
  );

  const Ext = ({ label, url }: { label: string; url: string }) => (
    <a
      role="menuitem"
      className="menu-item menu-link"
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={() => setOpen(false)}
    >
      {label} &#8599;
    </a>
  );

  return (
    <div id="main-menu" ref={ref}>
      <button
        id="main-menu-btn"
        type="button"
        aria-label="Menu"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="menu-bars" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </button>

      {open && (
        <div id="main-menu-dropdown" role="menu">
          <Section title="View">
            <Radio on={p.view === "map"} label="Map" onClick={act(() => p.onViewChange("map"))} />
            <Radio on={p.view === "table"} label="Sites Table" onClick={act(() => p.onViewChange("table"))} />
            <Radio on={p.view === "counties"} label="County Summary" onClick={act(() => p.onViewChange("counties"))} />
            <Radio on={p.view === "curated"} label={`Hand-picked Sites (${p.curatedCount})`} onClick={act(() => p.onViewChange("curated"))} />
          </Section>

          <Section title="Basemap">
            {BASE_MAP_IDS.map((id) => (
              <Radio key={id} on={p.basemap === id} label={BASE_MAP_LABELS[id]} onClick={() => p.onSetBasemap(id)} />
            ))}
          </Section>

          <Section title="Layers">
            <Check on={p.shading} label="Sites per county (shading)" onClick={p.onToggleShading} />
            <Check on={p.curatedOn} label="Hand-picked sites" onClick={p.onToggleCurated} />
            <Check on={p.labels} label="County names" onClick={p.onToggleLabels} />
          </Section>

          <Section title="Tools">
            <button type="button" role="menuitem" className="menu-item" onClick={act(p.onNearMe)}>
              Find sites near me
            </button>
            <button type="button" role="menuitem" className="menu-item" onClick={act(p.onExportCsv)}>
              Download CSV ({p.exportCount.toLocaleString()} sites)
            </button>
            <button type="button" role="menuitem" className="menu-item" onClick={act(p.onFitOhio)}>
              Zoom to all of Ohio
            </button>
            <button type="button" role="menuitem" className="menu-item" onClick={act(p.onAbout)}>
              About the data
            </button>
          </Section>

          <Section title="Data Sources">
            {DATA_LINKS.map((l) => (
              <Ext key={l.url} label={l.label} url={l.url} />
            ))}
          </Section>

          <Section title="My Ohio Pages">
            {OHIO_PAGES.map((pg) => (
              <Ext key={pg.url} label={pg.label} url={pg.url} />
            ))}
          </Section>

          <Section title="Links">
            <Ext label="GitHub Actions" url={`${GITHUB_REPO_URL}/actions`} />
            <Ext label="GitHub Repository" url={GITHUB_REPO_URL} />
            <Ext label="MyWebSite" url={MY_WEBSITE_URL} />
            <Ext label="Statehouse Home" url={STATEHOUSE_HOME_URL} />
          </Section>
        </div>
      )}
    </div>
  );
}
