import { useEffect, useEffectEvent, useRef, useState } from "react";
import { classify, colorsFor } from "../lib/layers.js";
import { dotTargets } from "./dots.js";

// Yield between evaluating the (large) globe module and building the globe,
// so neither blocks input for as long as both together would.
const nextTask = () => new Promise((resolve) => setTimeout(resolve, 0));
const loadRenderer = async (container, handlers) => {
  const { createGlobeRenderer } = await import("./globeRenderer.js");
  await nextTask();
  return createGlobeRenderer(container, handlers);
};

// The globe as a React component. Drawing goes through a renderer object
// (globe.gl in the browser, a fake in tests), created once per mount.
function layerPaint(layer, entities) {
  const labels = new Map(entities.map((entity) => {
    const value = entity.layers?.[layer.id]?.value;
    return [entity.code, classify(layer, entity) ? layer.describe(value) : "No data"];
  }));
  return { colors: colorsFor(layer, entities), labels };
}

export function GlobeView({ borders, entities, focus, layer = null, onSelect, createRenderer = loadRenderer }) {
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

  useEffect(() => {
    if (!renderer || !entities) return;
    renderer.setLayer(layer ? layerPaint(layer, entities) : null);
    container.current.dataset.layer = layer?.id ?? "none";
  }, [renderer, entities, layer]);

  return <div ref={container} className="absolute inset-0" data-testid="globe" />;
}
