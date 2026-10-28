import { useEffect, useId } from "react";
import { FieldRow } from "./FieldRow.jsx";
import { FIELDS_BY_SECTION } from "./fields.js";
import { Flag } from "./Flag.jsx";

const SECTIONS = [["leadership", "Leadership"], ["government", "Government"], ["people", "People"],
  ["economy", "Economy"], ["politics", "Politics"]];
const hostOf = (url) => new URL(url).hostname;
const fieldName = (field) => field.key.split(".")[1];

function useEscape(onClose) {
  useEffect(() => {
    const close = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);
}

export function CountryPanel({ selection, country, onClose, today = new Date(), headingRef }) {
  useEscape(onClose);
  const headingId = useId();
  const name = country?.header.name?.value ?? selection.profile.name;
  return (
    <section aria-labelledby={headingId} className="flex h-full flex-col">
      <header className="flex items-start gap-3 border-b border-neutral-800 p-4">
        <Flag iso2={country?.header.iso2?.value} />
        <div className="min-w-0">
          <h2 id={headingId} ref={headingRef} tabIndex={-1} className="text-xl font-semibold outline-none">{name}</h2>
          {country?.header.capital && <p className="text-sm text-neutral-400">{country.header.capital.value}</p>}
        </div>
        <button type="button" aria-label="Close" onClick={onClose}
          className="ml-auto rounded px-2 text-xl leading-none text-neutral-400 hover:text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
          ×
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-4">
        {selection.territory && <TerritoryBanner territory={selection.territory} profileName={name} />}
        {country ? <Profile country={country} today={today} /> : <Skeleton name={name} />}
      </div>
    </section>
  );
}

function TerritoryBanner({ territory, profileName }) {
  const text = territory.note ? territory.note.value : `Shown with ${profileName}'s profile`;
  return (
    <p role="status" aria-label="Territory" className="mb-4 rounded border border-sky-800 bg-sky-950/60 p-3 text-sm">
      {`${territory.name}: ${text}`}
    </p>
  );
}

function RecognitionBanner({ recognition }) {
  if (!recognition || recognition.value.status === "full") return null;
  return (
    <p role="status" aria-label="Recognition status" className="mb-4 rounded border border-amber-800 bg-amber-950/50 p-3 text-sm">
      {recognition.value.note ?? `Recognition: ${recognition.value.status}`}
    </p>
  );
}

function Profile({ country, today }) {
  return (
    <>
      <RecognitionBanner recognition={country.government.recognitionStatus} />
      {SECTIONS.map(([key, title]) => <Section key={key} title={title} section={country[key]} fields={FIELDS_BY_SECTION[key]} today={today} />)}
      <Tensions items={country.tensions.items} />
      <Sources sources={country.meta.sources} />
    </>
  );
}

function Section({ title, section, fields, today }) {
  const present = fields.filter((field) => section[fieldName(field)]);
  if (present.length === 0) return null;
  return (
    <section className="mb-5">
      <h3 className="mb-1 text-sm font-semibold text-neutral-200">{title}</h3>
      <dl className="divide-y divide-neutral-800/70">
        {present.map((field) => <FieldRow key={field.key} field={field} sourced={section[fieldName(field)]} today={today} />)}
      </dl>
    </section>
  );
}

const CHIP = { active_conflict: "bg-red-900/70 text-red-100", tension: "bg-amber-900/70 text-amber-100", dispute: "bg-violet-900/70 text-violet-100" };

function Tensions({ items }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-sm font-semibold text-neutral-200">Tensions &amp; conflicts</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.title} aria-label={item.title} className="rounded border border-neutral-800 p-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`rounded px-1.5 text-xs ${CHIP[item.status]}`}>{item.statusLabel}</span>
              <span>{item.title}</span>
            </div>
            <p className="mt-1 text-xs text-neutral-400">
              {item.parties.join(" · ")} · <a className="underline" href={item.sourceUrl} target="_blank" rel="noreferrer">{hostOf(item.sourceUrl)}</a>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Sources({ sources }) {
  return (
    <section>
      <h3 className="mb-1 text-sm font-semibold text-neutral-200">Sources</h3>
      <ul className="text-sm text-neutral-400">
        {sources.map((source) => (
          <li key={source.url}><a className="underline hover:text-neutral-100" href={source.url} target="_blank" rel="noreferrer">{source.name}</a></li>
        ))}
      </ul>
    </section>
  );
}

function Skeleton({ name }) {
  return (
    <div role="status" aria-label={`Loading ${name}`} className="space-y-3">
      {[0, 1, 2, 3, 4, 5].map((row) => <div key={row} className="h-8 animate-pulse rounded bg-neutral-800/70" />)}
    </div>
  );
}
