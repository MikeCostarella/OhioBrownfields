import { useEffect } from "react";
import type { Site } from "../types/site";
import {
  directionsUrl,
  displayName,
  frsUrl,
  googleMapsUrl,
  hasCountyMismatch,
} from "../data/sites";
import { UPDATE_RECIPIENT_EMAIL } from "../config/contact";
import { formatMiles, milesBetween } from "../lib/geo";
import CopyButton from "./CopyButton";

interface Props {
  site: Site | null;
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

/** Detail dialog for one brownfield site. */
export default function SiteDetail({ site, you, onClose, onZoom }: Props) {
  useEffect(() => {
    if (!site) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [site, onClose]);

  if (!site) return null;
  const name = displayName(site.name);
  const coords = `${site.lat.toFixed(5)}, ${site.lon.toFixed(5)}`;
  const miles = you ? milesBetween(you.lat, you.lon, site.lat, site.lon) : null;
  const subject = `Ohio Brownfields: correction for ${name} (ACRES ${site.id})`;
  const body =
    `Site: ${name}\nACRES ID: ${site.id}\nFRS ID: ${site.frs}\nAddress: ${site.address}, ${site.city}, OH ${site.zip}\n` +
    `Coordinates: ${coords}\n\nWhat should change?\n`;
  const mailto = `mailto:${UPDATE_RECIPIENT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="detail-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="detail" role="dialog" aria-modal="true" aria-labelledby="site-title">
        <div className="detail-head">
          <div>
            <div className="eyebrow">EPA ACRES brownfield property</div>
            <h2 id="site-title">{name}</h2>
            <div className="seat">
              {displayName(site.address)}
              {site.address ? ", " : ""}
              {site.city}, OH {site.zip}
            </div>
          </div>
          <button className="detail-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="detail-body">
          {hasCountyMismatch(site) && (
            <div className="note">
              EPA's record lists <b>{site.epaCounty || "no county"}</b>, but these coordinates fall in{" "}
              <b>{site.county} County</b>. The map uses the location.
            </div>
          )}
          <div className="kv-grid">
            <Row label="County">{site.county} County</Row>
            {miles !== null && <Row label="Distance">{formatMiles(miles)} from you</Row>}
            <Row label="ACRES ID">
              <span className="mono">{site.id}</span> <CopyButton text={site.id} />
            </Row>
            <Row label="FRS Registry ID">
              <span className="mono">{site.frs}</span> <CopyButton text={site.frs} />
            </Row>
            <Row label="Coordinates">
              <span className="mono">{coords}</span> <CopyButton text={coords} />
            </Row>
            <Row label="Located by">
              {site.method || "Not reported"}
              {site.accuracyM ? ` (±${site.accuracyM} m)` : ""}
            </Row>
            {site.huc8 && (
              <Row label="Watershed (HUC-8)">
                <span className="mono">{site.huc8}</span>
              </Row>
            )}
            <Row label="Last reported">{site.reported || "—"}</Row>
            <Row label="Added to FRS">{site.added || "—"}</Row>
          </div>

          <div className="btn-row">
            <button type="button" className="btn btn-zoom" onClick={() => onZoom(site.id)}>
              Zoom to site
            </button>
            <a className="btn btn-gmap" href={googleMapsUrl(site)} target="_blank" rel="noreferrer">
              Google Maps
            </a>
            <a className="btn btn-dir" href={directionsUrl(site)} target="_blank" rel="noreferrer">
              Directions
            </a>
            <a className="btn btn-epa" href={frsUrl(site)} target="_blank" rel="noreferrer">
              EPA facility record
            </a>
            <a className="btn btn-suggest" href={mailto}>
              Suggest an edit
            </a>
          </div>
          <p className="fineprint">
            Listed in ACRES because a grantee used EPA Brownfields funding to assess or clean up this property. Being on
            this list does not mean the site is currently contaminated or unsafe. Check the EPA record for cleanup status.
          </p>
        </div>
      </div>
    </div>
  );
}
