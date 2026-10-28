import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GlobeView } from "../globe/GlobeView.jsx";
import { LayerControls } from "../layers/LayerControls.jsx";
import { resolveSelection } from "../lib/selection.js";
import { CountryPanel } from "../panel/CountryPanel.jsx";
import { SearchBox } from "../search/SearchBox.jsx";
import { PanelFrame } from "./PanelFrame.jsx";

function useLoaded(load) {
  const [state, setState] = useState({ value: null, error: null });
  useEffect(() => {
    let current = true;
    load().then(
      (value) => current && setState({ value, error: null }),
      (error) => current && setState({ value: null, error }),
    );
    return () => { current = false; };
  }, [load]);
  return state;
}

function useCountry(data, code) {
  const [loaded, setLoaded] = useState({ code: null, country: null });
  useEffect(() => {
    if (!code) return;
    let current = true;
    data.country(code).then((country) => current && setLoaded({ code, country }), () => {});
    return () => { current = false; };
  }, [data, code]);
  return loaded.code === code ? loaded.country : null;
}

// The whole reader: globe, search, and the panel for the country in the URL.
export function Explorer({ code, navigate, data, createRenderer, today }) {
  const index = useLoaded(data.index);
  const borders = useLoaded(data.borders);
  const entities = index.value;
  const selection = useMemo(() => (code && entities ? resolveSelection(entities, code) : null), [code, entities]);
  const country = useCountry(data, selection?.profile.code);
  const headingRef = useRef(null);
  const searchRef = useRef(null);
  const [layer, setLayer] = useState(null);

  useEffect(() => {
    if (country) headingRef.current?.focus();
  }, [country]);

  const open = useCallback((picked) => navigate(`/country/${picked}`), [navigate]);
  const close = useCallback(() => {
    navigate("/");
    searchRef.current?.focus();
  }, [navigate]);

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#05070d] text-neutral-100">
      <div className={`absolute inset-x-0 top-0 ${code ? "bottom-[60dvh] md:bottom-0 md:right-[400px]" : "bottom-0"}`}>
        <GlobeView borders={borders.value} entities={entities} focus={selection?.focus ?? null} layer={layer}
          onSelect={open} createRenderer={createRenderer} />
      </div>
      <div className="absolute inset-x-4 top-4 z-20 space-y-3 md:right-auto md:w-96">
        <SearchBox entities={entities ?? []} onSelect={open} inputRef={searchRef} />
        <div className={code ? "hidden md:block" : ""}>
          <LayerControls entities={entities ?? []} layer={layer} onChange={setLayer} />
        </div>
      </div>
      {index.error && <p role="alert" className="absolute inset-x-4 top-20 z-20 rounded bg-red-950/90 p-3 text-sm">Country data could not be loaded. Reload to try again.</p>}
      {!code && <p className="pointer-events-none absolute inset-x-0 bottom-10 z-10 text-center text-sm text-neutral-400">Click a country or search</p>}
      {code && (
        <PanelFrame>
          <PanelContent code={code} entities={entities} selection={selection} country={country} onClose={close}
            today={today} headingRef={headingRef} />
        </PanelFrame>
      )}
      <p aria-live="polite" className="sr-only">{country && selection ? `${selection.profile.name} profile opened` : ""}</p>
      <p className="absolute bottom-2 left-3 z-10 text-[11px] text-neutral-400">Borders: Natural Earth (de facto lines) · Every fact links to its source</p>
    </main>
  );
}

function PanelContent({ code, entities, selection, country, onClose, today, headingRef }) {
  if (!entities) return <p role="status" className="p-4 text-sm text-neutral-400">Loading…</p>;
  if (!selection) {
    return (
      <div className="p-4 text-sm">
        <p>{`No country or territory has the code ${code.toUpperCase()}.`}</p>
        <button type="button" onClick={onClose} className="mt-3 underline">Back to the globe</button>
      </div>
    );
  }
  return <CountryPanel selection={selection} country={country} onClose={onClose} today={today} headingRef={headingRef} />;
}
