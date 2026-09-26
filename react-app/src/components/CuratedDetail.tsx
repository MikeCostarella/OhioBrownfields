import { useEffect } from "react";
import type { CuratedSite } from "../types/site";
import { UPDATE_RECIPIENT_EMAIL } from "../config/contact";
import { formatMiles, milesBetween } from "../lib/geo";
import CopyButton from "./CopyButton";

interface Props {
  site: CuratedSite | null;
  you: { lat: number; lon: number } | null;
  onClose: () => void;
  onZoom: (id: string) => void;
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="kv">
      <span className="kv-label">{label}</span>
      <span className="kv-val">{children}</span>
    </div>
  );
}

/** Detail dialog for a hand-picked (non-ACRES) brownfield. */
export default function CuratedDetail({ site, you, onClose, onZoom }: Props) {
  useEffect(() => {
    if (!site) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [site, onClose]);

  if (!site) return null;
  const coords = `${site.lat.toFixed(5)}, ${site.lon.toFixed(5)}`;
  const miles = you ? milesBetween(you.lat, you.lon, site.lat, site.lon) : null;
  const gmaps = `https://www.google.com/maps/search/?api=1&query=${site.lat},${site.lon}`;
  const dirs = `https://www.google.com/maps/dir/?api=1&destination=${site.lat},${site.lon}`;
  const subject = `Ohio Brownfields: update for ${site.name} (hand-picked)`;
  const body = `Site: ${site.name}\nLocation: ${site.address}, ${site.city}\n\nWhat should change? (please include a source link)\n`;
  const mailto = `mailto:${UPDATE_RECIPIENT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="detail-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="detail detail--curated" role="dialog" aria-modal="true" aria-labelledby="curated-title">
        <div className="detail-head">
          <div>
            <div className="eyebrow">
              <span className="badge-curated">Hand-picked</span> Not in EPA's ACRES list
            </div>
            <h2 id="curated-title">{site.name}</h2>
            <div className="seat">
              {site.address}, {site.city}
            </div>
          </div>
          <button className="detail-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="detail-body">
          <p className="status-line">{site.status}</p>
          <p className="summary">{site.summary}</p>
          <div className="kv-grid">
            <Row label="Former use">{site.formerUse}</Row>
            <Row label="County">{site.county} County</Row>
            {site.acres !== null && <Row label="Size">{site.acres.toLocaleString()} acres</Row>}
            {site.owner && <Row label="Owner">{site.owner}</Row>}
            {site.program && <Row label="Cleanup / funding">{site.program}</Row>}
            {miles !== null && <Row label="Distance">{formatMiles(miles)} from you</Row>}
            <Row label="Map location">
              <span className="mono">{coords}</span> <CopyButton text={coords} />
              {site.locationPrecision === "approximate" && <span className="approx"> approximate</span>}
            </Row>
          </div>

          <div className="sources">
            <div className="sources-title">Sources</div>
            <ol>
              {site.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                  </a>
                  <span className="src-meta">
                    {" "}
                    — {s.publisher}
                    {s.date ? `, ${s.date}` : ""}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          <div className="btn-row">
            <button type="button" className="btn btn-zoom" onClick={() => onZoom(site.id)}>
              Zoom to site
            </button>
            <a className="btn btn-gmap" href={gmaps} target="_blank" rel="noreferrer">
              Google Maps
            </a>
            <a className="btn btn-dir" href={dirs} target="_blank" rel="noreferrer">
              Directions
            </a>
            <a className="btn btn-suggest" href={mailto}>
              Suggest an edit
            </a>
          </div>
          <p className="fineprint">
            Hand-picked from news and government sources; last checked {site.reviewed}. It is not in EPA's ACRES
            list, usually because cleanup was privately or state funded. Details can change quickly, so check the
            sources for the latest.
          </p>
        </div>
      </div>
    </div>
  );
}
