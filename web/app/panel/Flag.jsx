import { useEffect, useState } from "react";

// Self-hosted SVG flags (flag-icons): flag emoji do not render on Windows, and
// a third-party flag CDN would see every visitor.
const flags = import.meta.glob("/node_modules/flag-icons/flags/4x3/*.svg", { query: "?url", import: "default" });

export function Flag({ iso2 }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    const load = flags[`/node_modules/flag-icons/flags/4x3/${iso2?.toLowerCase()}.svg`];
    let current = true;
    load?.().then((loaded) => current && setUrl(loaded));
    return () => { current = false; };
  }, [iso2]);
  if (!url) return <span className="inline-block h-6 w-8 rounded-sm bg-neutral-800" aria-hidden="true" />;
  return <img src={url} alt="" className="h-6 w-8 rounded-sm object-cover shadow" />;
}
