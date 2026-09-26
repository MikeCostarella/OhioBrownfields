import { useEffect, useRef, useState } from "react";
import type { Site } from "../types/site";
import { displayName } from "../data/sites";
import { formatMiles } from "../lib/geo";
import Highlight from "./Highlight";

interface Props {
  sites: Site[];
  query: string;
  selectedId: string | null;
  distances: Record<string, number> | null;
  onSelect: (id: string) => void;
}

const PAGE = 200;

/** Sidebar list of the currently filtered sites (paged so long lists stay fast). */
export default function SiteList({ sites, query, selectedId, distances, onSelect }: Props) {
  const [shown, setShown] = useState(PAGE);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setShown(PAGE);
    listRef.current?.scrollTo({ top: 0 });
  }, [sites]);

  // Keep the selected row in view when it is chosen on the map.
  useEffect(() => {
    if (!selectedId) return;
    const idx = sites.findIndex((s) => s.id === selectedId);
    if (idx >= shown) setShown(idx + 20);
    requestAnimationFrame(() => {
      listRef.current?.querySelector(`[data-id="${selectedId}"]`)?.scrollIntoView({ block: "nearest" });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  if (sites.length === 0) {
    return (
      <div className="site-list">
        <div className="list-empty">No sites match. Try a shorter search or choose “All counties”.</div>
      </div>
    );
  }

  return (
    <div className="site-list" ref={listRef}>
      {sites.slice(0, shown).map((s) => (
        <button
          key={s.id}
          type="button"
          data-id={s.id}
          className={"site-row" + (s.id === selectedId ? " is-selected" : "")}
          onClick={() => onSelect(s.id)}
        >
          <span className="sr-main">
            <span className="sr-name">
              <Highlight text={displayName(s.name)} query={query} />
            </span>
            <span className="sr-addr">
              <Highlight text={[displayName(s.address), s.city].filter(Boolean).join(", ")} query={query} /> ·{" "}
              {s.county} Co.
            </span>
          </span>
          <span className="sr-side">
            {distances ? <span className="sr-dist">{formatMiles(distances[s.id])}</span> : <span className="sr-id">#{s.id}</span>}
          </span>
        </button>
      ))}
      {sites.length > shown && (
        <button type="button" className="list-more" onClick={() => setShown((n) => n + PAGE)}>
          Show {Math.min(PAGE, sites.length - shown)} more of {sites.length - shown}
        </button>
      )}
    </div>
  );
}
