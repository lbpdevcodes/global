import { geoContains } from "d3-geo";
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

const escapeHtml = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const prefersReducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Disputed areas: a translucent amber fill and outline (globe.gl's polygon caps
// have no texture coordinates, so a hatch pattern cannot be mapped onto them).
// globe.gl behind the renderer interface GlobeView expects:
// setData({countries, disputed, entities, dots}), select(code, centroid), destroy().
export function createGlobeRenderer(container, { onSelect }) {
  const state = { selected: null, hovered: null, countries: [], entities: new Map() };
  const isDisputed = (feature) => feature.properties.disputed === true;
  const nameOf = (code, fallback) => state.entities.get(code)?.name ?? fallback;

  const capColor = (feature) => {
    if (isDisputed(feature)) return COLORS.disputedFill;
    const { code } = feature.properties;
    if (code === state.selected) return COLORS.selected;
    return code === state.hovered && state.entities.has(code) ? COLORS.hovered : COLORS.land;
  };

  const label = (feature) => {
    const { code, name, note } = feature.properties;
    if (isDisputed(feature)) return `<div class="globe-label"><b>${escapeHtml(name)}</b><br>${escapeHtml(note ?? "")} (${NATURAL_EARTH_NOTE})</div>`;
    const known = state.entities.has(code);
    return `<div class="globe-label">${escapeHtml(nameOf(code, name))}${known ? "" : " · not profiled"}</div>`;
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
    .polygonStrokeColor((feature) => (isDisputed(feature) ? COLORS.disputedStroke : COLORS.stroke))
    .polygonAltitude((feature) => (isDisputed(feature) ? 0.009 : feature.properties.code === state.selected ? 0.014 : 0.006))
    .polygonsTransitionDuration(200)
    .polygonLabel(label)
    .onPolygonHover((feature) => {
      state.hovered = feature && !isDisputed(feature) ? feature.properties.code : null;
      container.style.cursor = state.hovered && state.entities.has(state.hovered) ? "pointer" : "";
      globe.polygonCapColor(capColor);
    })
    .onPolygonClick((feature, _event, coords) => choose(feature, coords))
    .pointColor((dot) => (dot.code === state.selected ? COLORS.selected : COLORS.dot))
    .pointAltitude(0.012)
    .pointRadius((dot) => (dot.code === state.selected ? 0.75 : 0.45))
    .pointLabel((dot) => `<div class="globe-label">${escapeHtml(dot.name)}</div>`)
    .onPointClick((dot) => onSelect(dot.code));

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
      globe.polygonsData([...countries, ...overlay]).pointsData(dots);
    },
    select(code, centroid) {
      state.selected = code;
      globe.polygonCapColor(capColor).polygonAltitude(globe.polygonAltitude())
        .pointColor(globe.pointColor()).pointRadius(globe.pointRadius());
      if (code) controls.autoRotate = false;
      if (centroid) globe.pointOfView({ lat: centroid.lat, lng: centroid.lng, altitude: 1.9 }, prefersReducedMotion() ? 0 : 900);
    },
    destroy() {
      observer.disconnect();
      globe._destructor();
      container.replaceChildren();
    },
  };
}
