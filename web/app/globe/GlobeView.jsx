import { useEffect, useEffectEvent, useRef, useState } from "react";
import { dotTargets } from "./dots.js";

const loadRenderer = (container, handlers) =>
  import("./globeRenderer.js").then(({ createGlobeRenderer }) => createGlobeRenderer(container, handlers));

// The globe as a React component. Drawing goes through a renderer object
// (globe.gl in the browser, a fake in tests), created once per mount.
export function GlobeView({ borders, entities, focus, onSelect, createRenderer = loadRenderer }) {
  const container = useRef(null);
  const [renderer, setRenderer] = useState(null);
  const select = useEffectEvent((code) => onSelect(code));

  useEffect(() => {
    let created = null;
    let mounted = true;
    createRenderer(container.current, { onSelect: (code) => select(code) }).then((ready) => {
      if (mounted) setRenderer((created = ready));
      else ready.destroy();
    });
    return () => {
      mounted = false;
      created?.destroy();
    };
  }, [createRenderer]);

  useEffect(() => {
    if (!renderer || !borders || !entities) return;
    renderer.setData({ countries: borders.countries, disputed: borders.disputed, entities, dots: dotTargets(borders.countries, entities) });
  }, [renderer, borders, entities]);

  useEffect(() => {
    renderer?.select(focus?.code ?? null, focus?.centroid ?? null);
  }, [renderer, focus]);

  return <div ref={container} className="absolute inset-0" data-testid="globe" />;
}
