import { useId, useState } from "react";
import { formatAsOf, formatValue, isStale } from "../lib/format.js";

const hostOf = (url) => new URL(url).hostname;

// One fact: label, value, a "may be outdated" marker past its refresh
// window, and its source and as-of date on request.
export function FieldRow({ field, sourced, today }) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const stale = isStale(sourced.asOf, field.refreshDays, today);
  return (
    <div className="py-2">
      <dt className="text-xs uppercase tracking-wide text-neutral-400">{field.label}</dt>
      <dd className="flex items-start gap-2">
        <span className="tabular-nums">{formatValue(field.key, sourced.value)}</span>
        {stale && <span className="rounded bg-amber-900/60 px-1.5 text-xs text-amber-200">May be outdated</span>}
        <button type="button" aria-label={`Source for ${field.label}`} aria-expanded={open} aria-controls={detailsId}
          onClick={() => setOpen(!open)}
          className="ml-auto rounded-full px-1.5 text-xs text-neutral-400 hover:text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
          ⓘ
        </button>
      </dd>
      {open && (
        <p id={detailsId} role="note" aria-label={`${field.label} source`} className="mt-1 text-xs text-neutral-400">
          <a href={sourced.source} className="underline hover:text-neutral-100" target="_blank" rel="noreferrer">{hostOf(sourced.source)}</a>
          {` · As of ${formatAsOf(sourced.asOf)}`}{sourced.period && ` · ${sourced.period} data`}
        </p>
      )}
    </div>
  );
}
