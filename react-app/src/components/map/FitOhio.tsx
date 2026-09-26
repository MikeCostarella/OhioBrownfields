import { useCallback, useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import type { FeatureCollection } from "geojson";

/**
 * Keeps the whole state framed in the viewport until the user takes over.
 * Renders nothing; it only drives the map instance.
 */
export default function FitOhio({ data }: { data: FeatureCollection | null }) {
  const map = useMap();
  const bounds = useRef<L.LatLngBounds | null>(null);
  const interacted = useRef(false);
  const fitting = useRef(false);

  const fit = useCallback(() => {
    if (!bounds.current || !bounds.current.isValid()) return;
    fitting.current = true;
    map.invalidateSize();
    map.fitBounds(bounds.current, { padding: [20, 20] });
    window.setTimeout(() => { fitting.current = false; }, 400);
  }, [map]);

  // Once the user pans or zooms, stop auto-reframing so we never yank them back.
  useEffect(() => {
    const onUser = () => { if (!fitting.current) interacted.current = true; };
    map.on("dragstart", onUser);
    map.on("zoomstart", onUser);
    return () => { map.off("dragstart", onUser); map.off("zoomstart", onUser); };
  }, [map]);

  useEffect(() => {
    if (!data) return;
    const b = L.geoJSON(data).getBounds();
    if (!b.isValid()) return;
    bounds.current = b;
    const id = requestAnimationFrame(() => fit());
    return () => cancelAnimationFrame(id);
  }, [data, fit]);

  // Re-frame on container resize until the user takes over; after that just
  // keep Leaflet's size in sync.
  useEffect(() => {
    const el = map.getContainer();
    const ro = new ResizeObserver(() => {
      map.invalidateSize();
      if (!interacted.current) fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [map, fit]);

  return null;
}
