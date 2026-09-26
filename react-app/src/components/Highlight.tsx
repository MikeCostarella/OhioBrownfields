interface Props {
  text: string;
  query: string;
}

// Wraps occurrences of `query` in <mark>, case-insensitive, without dangerouslySetInnerHTML.
export default function Highlight({ text, query }: Props) {
  const q = query.trim();
  if (!q) return <>{text}</>;
  const lower = text.toLowerCase();
  const ql = q.toLowerCase();
  const parts: Array<{ str: string; hit: boolean }> = [];
  let i = 0;
  while (i < text.length) {
    const idx = lower.indexOf(ql, i);
    if (idx === -1) {
      parts.push({ str: text.slice(i), hit: false });
      break;
    }
    if (idx > i) parts.push({ str: text.slice(i, idx), hit: false });
    parts.push({ str: text.slice(idx, idx + ql.length), hit: true });
    i = idx + ql.length;
  }
  return (
    <>
      {parts.map((p, k) => (p.hit ? <mark key={k}>{p.str}</mark> : <span key={k}>{p.str}</span>))}
    </>
  );
}
