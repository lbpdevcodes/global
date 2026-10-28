import { geoArea, geoContains } from "d3-geo";
import Globe from "globe.gl";
import { MeshPhongMaterial } from "three";

const COLORS = {
  background: "#05070d",
  ocean: "#0b1424",
  land: "#273044",
  hovered: "#3a4660",
  selected: "#38bdf8",
  stroke: "#55627d",
  dot: "#7dd3fc",
  disputedFill: "rgba(251, 191, 36, 0.22)",
  disputedStroke: "#fbbf24",
  atmosphere: "#7dd3fc",
};
const NATURAL_EARTH_NOTE = "Natural Earth, 2022";
// Shapes are added a few at a time, one batch per frame, largest first, so
// building their geometry never blocks input for long.
const SHAPES_PER_FRAME = 8;

const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Disputed areas: a translucent amber fill and outline (globe.gl's polygon caps
// have no texture coordinates, so a hatch pattern cannot be mapped onto them).
// globe.gl behind the renderer interface GlobeView expects:
// setData({countries, disputed, entities, dots}), setLayer({colors, labels} | null),
// select(code, centroid), destroy().
export function createGlobeRenderer(container, { onSelect }) {
  const state = { selected: null, hovered: null, countries: [], entities: new Map(), layer: null, frame: null };
  const isDisputed = (feature) => feature.properties.disputed === true;
  const nameOf = (code, fallback) => state.entities.get(code)?.name ?? fallback;

  const capColor = (feature) => {
    if (isDisputed(feature)) return COLORS.disputedFill;
    const { code } = feature.properties;
    if (state.layer) return state.layer.colors.get(code) ?? COLORS.land;
    if (code === state.selected) return COLORS.selected;
    return code === state.hovered && state.entities.has(code) ? COLORS.hovered : COLORS.land;
  };

  const label = (feature) => {
    const { code, name, note } = feature.properties;
    if (isDisputed(feature)) return `<div class="globe-label"><b>${escapeHtml(name)}</b><br>${escapeHtml(note ?? "")} (${NATURAL_EARTH_NOTE})</div>`;
    const known = state.entities.has(code);
    const layerText = state.layer?.labels.get(code);
    const detail = known ? (layerText ? ` · ${escapeHtml(layerText)}` : "") : " · not profiled";
    return `<div class="globe-label">${escapeHtml(nameOf(code, name))}${detail}</div>`;
  };

  const countryAt = ({ lat, lng }) => state.countries.find((feature) => geoContains(feature, [lng, lat]));

  const choose = (feature, coords) => {
    const target = isDisputed(feature) ? countryAt(coords) : feature;
    const code = target?.properties.code;
    if (code && state.entities.has(code)) onSelect(code);
  };

  const globe = new Globe(container, { animateIn: !prefersReducedMotion() })
    .backgroundColor(COLORS.background)
    .globeMaterial(new MeshPhongMaterial({ color: COLORS.ocean }))
    .showAtmosphere(true)
    .atmosphereColor(COLORS.atmosphere)
    .atmosphereAltitude(0.12)
    .polygonCapColor(capColor)
    .polygonSideColor(() => "rgba(5, 7, 13, 0.6)")
    .polygonStrokeColor((feature) => {
      if (isDisputed(feature)) return COLORS.disputedStroke;
      return state.layer && feature.properties.code === state.selected ? "#ffffff" : COLORS.stroke;
    })
    .polygonAltitude((feature) => (isDisputed(feature) ? 0.009 : feature.properties.code === state.selected ? 0.014 : 0.006))
    .polygonsTransitionDuration(0)
    .polygonLabel(label)
    .onPolygonHover((feature) => {
      state.hovered = feature && !isDisputed(feature) ? feature.properties.code : null;
      container.style.cursor = state.hovered && state.entities.has(state.hovered) ? "pointer" : "";
      globe.polygonCapColor(capColor);
    })
    .onPolygonClick((feature, _event, coords) => choose(feature, coords))
    .pointColor((dot) => state.layer?.colors.get(dot.code) ?? (dot.code === state.selected ? COLORS.selected : COLORS.dot))
    .pointAltitude(0.012)
    .pointRadius((dot) => (dot.code === state.selected ? 0.75 : 0.45))
    .pointLabel((dot) => `<div class="globe-label">${escapeHtml(dot.name)}</div>`)
    .onPointClick((dot) => onSelect(dot.code));

  // A 3x phone screen would otherwise fill four times the pixels of 1.5x.
  globe.renderer().setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

  const controls = globe.controls();
  controls.autoRotate = !prefersReducedMotion();
  controls.autoRotateSpeed = 0.35;
  controls.addEventListener("start", () => {
    controls.autoRotate = false;
  });

  const resize = () => globe.width(container.clientWidth).height(container.clientHeight);
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();

  return {
    setData({ countries, disputed, entities, dots }) {
      state.countries = countries;
      state.entities = new Map(entities.map((entity) => [entity.code, entity]));
      const overlay = disputed.map((feature) => ({ ...feature, properties: { ...feature.properties, disputed: true } }));
      const shapes = countries.toSorted((a, b) => geoArea(b) - geoArea(a)).concat(overlay);
      globe.pointsData(dots);
      cancelAnimationFrame(state.frame);
      const addBatch = (shown) => {
        globe.polygonsData(shapes.slice(0, shown));
        if (shown < shapes.length) state.frame = requestAnimationFrame(() => addBatch(shown + SHAPES_PER_FRAME));
      };
      addBatch(SHAPES_PER_FRAME);
    },
    setLayer(layer) {
      state.layer = layer;
      globe.polygonCapColor(capColor).polygonStrokeColor(globe.polygonStrokeColor()).polygonLabel(label)
        .pointColor(globe.pointColor());
    },
    select(code, centroid) {
      state.selected = code;
      globe.polygonCapColor(capColor).polygonStrokeColor(globe.polygonStrokeColor()).polygonAltitude(globe.polygonAltitude())
        .pointColor(globe.pointColor()).pointRadius(globe.pointRadius());
      if (code) controls.autoRotate = false;
      if (centroid) globe.pointOfView({ lat: centroid.lat, lng: centroid.lng, altitude: 1.9 }, prefersReducedMotion() ? 0 : 900);
    },
    destroy() {
      cancelAnimationFrame(state.frame);
      observer.disconnect();
      globe._destructor();
      container.replaceChildren();
    },
  };
}
