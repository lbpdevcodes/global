import { useId, useState } from "react";
import { blocLayer, blocsIn, classify, LAYERS, layerFor, NO_DATA, noDataLabel, valueFor } from "../lib/layers.js";

// Choose what colors the globe, read its legend, or read it as a table.
export function LayerControls({ entities, layer, onChange }) {
  const [listOpen, setListOpen] = useState(false);
  const name = useId();
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/85 p-3 text-sm shadow-lg backdrop-blur">
      <fieldset>
        <legend className="mb-1.5 text-xs uppercase tracking-wide text-neutral-400">Color the globe by</legend>
        <div role="radiogroup" aria-label="Color the globe by" className="flex flex-wrap gap-1.5">
          {[null, ...LAYERS].map((option) => (
            <label key={option?.id ?? "none"}
              className={`cursor-pointer rounded-full border px-2.5 py-1 text-xs has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-sky-400 ${layer?.id === option?.id ? "border-sky-500 bg-sky-950 text-sky-100" : "border-neutral-700 text-neutral-300 hover:border-neutral-500"}`}>
              <input type="radio" name={name} className="sr-only" checked={layer?.id === option?.id}
                onChange={() => { onChange(layerFor(option, entities)); setListOpen(false); }} />
              {option?.label ?? "None"}
            </label>
          ))}
        </div>
      </fieldset>
      {layer && (
        <>
          {layer.bloc && <BlocPicker entities={entities} bloc={layer.bloc} onChange={(bloc) => onChange(blocLayer(bloc))} />}
          <Legend layer={layer} />
          <button type="button" onClick={() => setListOpen(!listOpen)} aria-expanded={listOpen}
            className="mt-2 text-xs text-sky-300 underline hover:text-sky-100">
            {listOpen ? "Hide list" : "View as list"}
          </button>
          {listOpen && <LayerTable layer={layer} entities={entities} />}
        </>
      )}
    </div>
  );
}

function BlocPicker({ entities, bloc, onChange }) {
  const id = useId();
  return (
    <div className="mt-3 flex items-center gap-2 text-xs">
      <label htmlFor={id} className="text-neutral-400">Bloc</label>
      <select id={id} value={bloc} onChange={(event) => onChange(event.target.value)}
        className="rounded border border-neutral-700 bg-neutral-900 px-2 py-1 text-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">
        {blocsIn(entities).map((name) => <option key={name}>{name}</option>)}
      </select>
    </div>
  );
}

function Swatch({ color }) {
  return <span aria-hidden="true" className="inline-block h-3 w-3 shrink-0 rounded-sm ring-1 ring-white/20" style={{ background: color }} />;
}

function Legend({ layer }) {
  return (
    <div className="mt-3">
      <ul aria-label={`${layer.label} legend`} className="space-y-1">
        {[...layer.classes.filter((c) => c.label !== "Tension or dispute"), { label: noDataLabel(layer), color: NO_DATA }].map((entry) => (
          <li key={entry.label} className="flex items-center gap-2 text-xs text-neutral-200">
            <Swatch color={entry.color} />{entry.label}
          </li>
        ))}
      </ul>
      {layer.note && <p className="mt-1 text-[11px] text-neutral-400">{layer.note}</p>}
    </div>
  );
}

function LayerTable({ layer, entities }) {
  const rows = entities.filter((e) => e.kind !== "territory").toSorted((a, b) => a.name.localeCompare(b.name))
    .map((entity) => {
      const value = valueFor(layer, entity);
      return { entity, group: classify(layer, entity)?.label ?? noDataLabel(layer), text: value == null ? "—" : layer.describe(value) };
    });
  return (
    <div className="mt-2 max-h-64 overflow-y-auto rounded border border-neutral-800">
      <table className="w-full text-left text-xs">
        <caption className="sr-only">{`${layer.label} by country`}</caption>
        <thead className="sticky top-0 bg-neutral-900 text-neutral-400">
          <tr><th scope="col" className="px-2 py-1">Country</th><th scope="col" className="px-2 py-1">Class</th><th scope="col" className="px-2 py-1">Value</th></tr>
        </thead>
        <tbody>
          {rows.map(({ entity, group, text }) => (
            <tr key={entity.code} className="border-t border-neutral-800/70">
              <td className="px-2 py-1">{entity.name}</td><td className="px-2 py-1">{group}</td><td className="px-2 py-1 tabular-nums">{text}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
