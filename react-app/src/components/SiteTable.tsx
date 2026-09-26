import { useMemo, useState } from "react";
import type { Site } from "../types/site";
import { displayName } from "../data/sites";
import Highlight from "./Highlight";

type SortKey = "name" | "address" | "city" | "county" | "zip" | "id" | "reported";

const COLS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Site" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "county", label: "County" },
  { key: "zip", label: "ZIP" },
  { key: "id", label: "ACRES ID" },
  { key: "reported", label: "Last Reported" },
];

interface Props {
  sites: Site[];
  query: string;
  onShowOnMap: (id: string) => void;
  onExportCsv: () => void;
}

const PAGE = 300;

/** Full-width sortable table of the filtered sites; click a row to see it on the map. */
export default function SiteTable({ sites, query, onShowOnMap, onExportCsv }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "county", dir: 1 });
  const [shown, setShown] = useState(PAGE);

  const sorted = useMemo(() => {
    const k = sort.key;
    const val = (s: Site) => (k === "id" ? Number(s.id) : k === "name" ? displayName(s.name) : s[k]);
    return [...sites].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return c * sort.dir || displayName(a.name).localeCompare(displayName(b.name));
    });
  }, [sites, sort]);

  const click = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));

  return (
    <div className="table-pane">
      <div className="table-toolbar">
        <span>
          <b>{sites.length.toLocaleString()}</b> sites · click a row to see it on the map
        </span>
        <button type="button" className="btn-secondary" onClick={onExportCsv}>
          Download CSV
        </button>
      </div>
      <div className="table-scroll">
        <table className="site-table">
          <thead>
            <tr>
              {COLS.map((c) => (
                <th key={c.key} aria-sort={sort.key === c.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" onClick={() => click(c.key)}>
                    {c.label} {sort.key === c.key ? (sort.dir === 1 ? "▲" : "▼") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.slice(0, shown).map((s) => (
              <tr key={s.id} onClick={() => onShowOnMap(s.id)} tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onShowOnMap(s.id)}>
                <td className="t-name"><Highlight text={displayName(s.name)} query={query} /></td>
                <td><Highlight text={displayName(s.address)} query={query} /></td>
                <td>{s.city}</td>
                <td>{s.county}</td>
                <td className="t-num">{s.zip}</td>
                <td className="t-num">{s.id}</td>
                <td className="t-num">{s.reported}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length > shown && (
          <button type="button" className="list-more" onClick={() => setShown((n) => n + PAGE)}>
            Show {Math.min(PAGE, sorted.length - shown)} more of {sorted.length - shown}
          </button>
        )}
      </div>
    </div>
  );
}
