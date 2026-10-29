// The map layers: the PRD's four (F4), then GDP per person, bloc membership
// and upcoming elections. Colors come from the data-viz reference palette,
// validated against the globe's ocean (#0b1424) with every pair compared, as
// a choropleth requires: only three categorical hues pass that test, so
// government types fold into three groups plus a neutral "Other", bloc
// membership uses one hue against that neutral, and ordered values use the
// sequential blues. Every class has a text label, used by the legend, the
// hover label and the list view, so color is never the only cue.

import { formatValue } from "./format.js";

export const NO_DATA = "#273044";
const OTHER = "#7b8394";
const DAY = 24 * 60 * 60 * 1000;

// Sequential blue, dark (low) to light (high) on the dark globe.
const BLUES = ["#184f95", "#1c5cab", "#2a78d6", "#5598e7", "#9ec5f4"];

const GOVERNMENT_GROUPS = [
  { label: "Presidential or semi-presidential republic", color: "#3987e5",
    types: ["Presidential republic", "Semi-presidential republic"] },
  { label: "Parliamentary republic", color: "#d95926", types: ["Parliamentary republic", "Directorial republic"] },
  { label: "Monarchy", color: "#199e70", types: ["Constitutional monarchy", "Absolute monarchy", "Monarchy"] },
];

function binned(edges, labels) {
  return labels.map((label, index) => ({
    label,
    color: BLUES[index],
    test: (value) => value >= edges[index] && (index === labels.length - 1 || value < edges[index + 1]),
  }));
}

export const LAYERS = [
  {
    id: "governmentType",
    label: "Government type",
    classes: [
      ...GOVERNMENT_GROUPS.map(({ label, color, types }) => ({ label, color, test: (type) => types.includes(type) })),
      { label: "Other or unspecified", color: OTHER, test: () => true },
    ],
    describe: (value) => value,
  },
  {
    id: "democracyScore",
    label: "Democracy score",
    note: "V-Dem Electoral Democracy Index, 0 to 1",
    classes: binned([0, 0.2, 0.4, 0.6, 0.8], ["0–0.2", "0.2–0.4", "0.4–0.6", "0.6–0.8", "0.8–1"]),
    describe: (value) => value.toFixed(2),
  },
  {
    id: "population",
    label: "Population",
    note: "Log scale",
    classes: binned([0, 1e6, 1e7, 5e7, 2e8],
      ["Under 1 million", "1–10 million", "10–50 million", "50–200 million", "200 million or more"]),
    describe: (value) => new Intl.NumberFormat("en-US").format(value),
  },
  {
    id: "conflictStatus",
    label: "Armed conflict",
    note: "UCDP; this year's figures are preliminary",
    classes: [
      { label: "Active armed conflict", color: "#d03b3b", test: (value) => value === "active_conflict" },
      { label: "Tension or dispute", color: "#ec835a", test: (value) => value === "tension" },
      { label: "None recorded", color: OTHER, test: (value) => value === "none" },
    ],
    describe: (value) => ({ active_conflict: "Active armed conflict", tension: "Tension or dispute", none: "None recorded" })[value],
  },
  {
    id: "gdpPerCapita",
    label: "GDP per person",
    note: "World Bank, current US$, latest year",
    classes: binned([0, 1_000, 4_000, 15_000, 40_000],
      ["Under $1,000", "$1,000–4,000", "$4,000–15,000", "$15,000–40,000", "$40,000 or more"]),
    describe: (value) => formatValue("economy.gdpPerCapitaUsd", value),
  },
  // The viewer picks the bloc (LayerControls); NATO is shown first.
  blocLayer("NATO"),
  electionsLayer(new Date()),
];

// Membership in one alliance or bloc, chosen by the viewer. Every bloc's layer
// reads the same "alliances" value, so the id stays the same while the bloc changes.
export function blocLayer(bloc) {
  const isMember = (blocs) => blocs.includes(bloc);
  return {
    id: "alliances",
    label: "Alliance or bloc",
    bloc,
    classes: [
      { label: `Member of ${bloc}`, color: "#3987e5", test: isMember },
      { label: "Not a member", color: OTHER, test: () => true },
    ],
    describe: (blocs) => (isMember(blocs) ? "Member" : "Not a member"),
  };
}

// The blocs the bloc layer can show, alphabetically. The UN is left out:
// every country is a member, so it would color the whole globe one way.
export function blocsIn(entities) {
  const blocs = new Set(entities.flatMap((entity) => entity.layers?.alliances?.value ?? []));
  blocs.delete("UN");
  return [...blocs].toSorted((a, b) => a.localeCompare(b));
}

// The last day a date of year, month or day precision can fall on.
function lastDay(date) {
  const [year, month, day] = date.split("-").map(Number);
  if (day) return Date.UTC(year, month - 1, day);
  if (month) return Date.UTC(year, month, 1) - DAY;
  return Date.UTC(year + 1, 0, 1) - DAY;
}

// How soon each country's next national election will certainly have
// happened, counted from today. Half the sources give only a year, so a date
// is placed by its last possible day: "2027" is never shown as imminent. An
// election whose last day has passed shows as no data: the source is behind.
export function electionsLayer(today) {
  const startOfToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  const within = (min, max) => ({ date }) => {
    const days = (lastDay(date) - startOfToday) / DAY;
    return days >= min && days <= max;
  };
  return {
    id: "nextElection",
    label: "Upcoming elections",
    noData: "No date known",
    classes: [
      { label: "Within 30 days", color: BLUES[4], test: within(0, 30) },
      { label: "Within 90 days", color: BLUES[2], test: within(31, 90) },
      { label: "Later, or date not yet fixed", color: BLUES[0], test: within(91, Infinity) },
    ],
    describe: (election) => formatValue("leadership.nextNationalElection", election),
  };
}

// What the legend, hover label and list call an entity with no value.
export function noDataLabel(layer) {
  return layer.noData ?? "No data";
}

// An entity's value for a layer, if the index has one.
export function valueFor(layer, entity) {
  return entity.layers?.[layer.id]?.value;
}

// The class an entity falls in for a layer, or null when it has no data.
export function classify(layer, entity) {
  const value = valueFor(layer, entity);
  if (entity.kind === "territory" || value === undefined || value === null) return null;
  return layer.classes.find((candidate) => candidate.test(value)) ?? null;
}

export function colorsFor(layer, entities) {
  return new Map(entities.map((entity) => [entity.code, classify(layer, entity)?.color ?? NO_DATA]));
}
