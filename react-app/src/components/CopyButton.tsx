import { useState } from "react";

/** Small inline "Copy" button; falls back gracefully if the clipboard is blocked. */
export default function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    } catch {
      /* clipboard unavailable — the value is still selectable on screen */
    }
  };
  return (
    <button type="button" className="copy-btn" onClick={copy} aria-label={`${label} ${text}`}>
      {done ? "Copied" : label}
    </button>
  );
}
