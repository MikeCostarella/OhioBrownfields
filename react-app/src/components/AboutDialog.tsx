import { useEffect } from "react";
import { COUNTIES_WITH_SITES, RETRIEVED, SITES, hasCountyMismatch } from "../data/sites";
import { CURATED } from "../data/curated";

/** What the data is, where it came from, and what it leaves out. */
export default function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const pulled = new Date(RETRIEVED).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  const mismatches = SITES.filter(hasCountyMismatch).length;
  return (
    <div className="detail-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="detail" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <div className="detail-head">
          <div>
            <div className="eyebrow">About the data</div>
            <h2 id="about-title">Ohio Brownfields</h2>
          </div>
          <button className="detail-close" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        <div className="detail-body prose">
          <p>
            This map shows all <b>{SITES.length.toLocaleString()}</b> Ohio properties in EPA's{" "}
            <b>Assessment, Cleanup and Redevelopment Exchange System (ACRES)</b>, spread across{" "}
            <b>{COUNTIES_WITH_SITES}</b> of Ohio's 88 counties. The snapshot was pulled {pulled} from EPA's Facility
            Registry Service map layer.
          </p>
          <h3>What ACRES covers</h3>
          <p>
            ACRES tracks properties where a grantee (a land bank, city, county, port authority, or similar) used EPA
            Brownfields grant money for assessment, cleanup, or a revolving loan. It is not a list of every
            contaminated or vacant property in Ohio. State programs track sites separately, including Ohio EPA's
            Voluntary Action Program, the Ohio Department of Development's Brownfield Remediation Program, and BUSTR
            for petroleum tanks.
          </p>
          <h3>Hand-picked sites</h3>
          <p>
            Teal diamonds mark {CURATED.length} well-known former industrial sites that are widely described as
            brownfields but aren't in ACRES, usually because their cleanup was privately or state funded. Examples
            include the McDonald Steel mill and the Niles and Lake Shore power plants. Each one lists the news and
            government sources behind it and the date it was last checked. Turn them off under Layers.
          </p>
          <h3>How counties are assigned</h3>
          <p>
            Each site's county comes from placing its coordinates inside U.S. Census county boundaries. {mismatches}{" "}
            EPA records list a different county than their location; those show a note in the site details.
          </p>
          <h3>Refreshing the data</h3>
          <p>
            Run <code>npm run data</code> in <code>react-app/</code> to pull a new snapshot from EPA into{" "}
            <code>src/data/sites.json</code>, then commit and push.
          </p>
        </div>
      </div>
    </div>
  );
}
