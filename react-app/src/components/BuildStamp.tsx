import { RETRIEVED } from "../data/sites";

function fmt(iso: string, withTime: boolean): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit", timeZoneName: "short" } : {}),
    });
  } catch {
    return iso;
  }
}

/**
 * Footer strip: data snapshot date and when this build was produced, including
 * the time-zone abbreviation (injected at build time via __BUILD_TIME__).
 */
export default function BuildStamp() {
  return (
    <div id="footer">
      <span id="data-date">EPA ACRES data pulled {fmt(RETRIEVED, false)}</span>
      <span id="build-time">Build: {fmt(__BUILD_TIME__, true)}</span>
    </div>
  );
}
