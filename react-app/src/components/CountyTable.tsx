import { useMemo, useState } from "react";
import { COUNTY_NAMES, COUNT_BY_COUNTY, FIPS_BY_COUNTY, SITES } from "../data/sites";
import { shadeFor } from "./map/CountyLayer";

interface Props {
  onPickCounty: (name: string) => void;
}

/** All 88 counties with their site counts, share of the state, and a bar. */
export default function CountyTable({ onPickCounty }: Props) {
  const [byCount, setByCount] = useState(true);
  const rows = useMemo(() => {
    const r = COUNTY_NAMES.map((n) => ({ name: n, fips: FIPS_BY_COUNTY[n], count: COUNT_BY_COUNTY[n] }));
    return byCount ? r.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)) : r;
  }, [byCount]);
  const max = Math.max(...rows.map((r) => r.count));
  const total = SITES.length;

  return (
    <div className="table-pane">
      <div className="table-toolbar">
        <span>
          <b>{rows.filter((r) => r.count > 0).length}</b> of 88 counties have ACRES brownfield sites · click a county to map it
        </span>
        <div className="seg">
          <button type="button" className={byCount ? "active" : ""} onClick={() => setByCount(true)}>Most sites</button>
          <button type="button" className={!byCount ? "active" : ""} onClick={() => setByCount(false)}>A–Z</button>
        </div>
      </div>
      <div className="table-scroll">
        <table className="site-table county-table">
          <thead>
            <tr>
              <th><span>County</span></th>
              <th><span>FIPS</span></th>
              <th className="t-num"><span>Sites</span></th>
              <th className="t-num"><span>Share</span></th>
              <th className="t-bar-h"><span>&nbsp;</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.name}
                className={r.count === 0 ? "is-empty" : ""}
                onClick={() => r.count > 0 && onPickCounty(r.name)}
                tabIndex={r.count > 0 ? 0 : -1}
                onKeyDown={(e) => e.key === "Enter" && r.count > 0 && onPickCounty(r.name)}
              >
                <td className="t-name">{r.name}</td>
                <td className="t-num">{r.fips}</td>
                <td className="t-num">{r.count}</td>
                <td className="t-num">{total ? ((r.count / total) * 100).toFixed(1) : "0.0"}%</td>
                <td className="t-bar">
                  <span style={{ width: `${max ? (r.count / max) * 100 : 0}%`, background: shadeFor(Math.max(r.count, 5)) }} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
