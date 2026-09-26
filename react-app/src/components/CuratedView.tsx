import type { CuratedSite } from "../types/site";
import Highlight from "./Highlight";

interface Props {
  sites: CuratedSite[];
  total: number;
  query: string;
  onOpen: (id: string) => void;
  onShowOnMap: (id: string) => void;
}

/** Full-width card list of the hand-picked sites with status and sources. */
export default function CuratedView({ sites, total, query, onOpen, onShowOnMap }: Props) {
  return (
    <div className="table-pane">
      <div className="table-toolbar">
        <span>
          <b>{sites.length}</b>
          {sites.length !== total ? ` of ${total}` : ""} hand-picked sites: well-known former industrial properties
          that aren't in EPA's ACRES list
        </span>
      </div>
      <div className="table-scroll">
        {sites.length === 0 ? (
          <div className="list-empty">No hand-picked sites match the current search or county.</div>
        ) : (
          <div className="curated-cards">
            {sites.map((c) => (
              <article className="curated-card" key={c.id}>
                <header>
                  <h3>
                    <Highlight text={c.name} query={query} />
                  </h3>
                  <div className="cc-meta">
                    {c.city} · {c.county} County
                    {c.acres !== null ? ` · ${c.acres.toLocaleString()} acres` : ""}
                  </div>
                </header>
                <p className="cc-use">{c.formerUse}</p>
                <p className="cc-status">{c.status}</p>
                <div className="cc-foot">
                  <span className="cc-src">
                    {c.sources.length} source{c.sources.length === 1 ? "" : "s"} · checked {c.reviewed}
                  </span>
                  <span className="cc-actions">
                    <button type="button" className="btn-secondary" onClick={() => onShowOnMap(c.id)}>
                      Map
                    </button>
                    <button type="button" className="btn-secondary" onClick={() => onOpen(c.id)}>
                      Details
                    </button>
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
