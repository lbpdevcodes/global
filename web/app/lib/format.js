const DAY = 24 * 60 * 60 * 1000;
const grouped = new Intl.NumberFormat("en-US");
const compactUsd = new Intl.NumberFormat("en-US", { notation: "compact", compactDisplay: "long", maximumSignificantDigits: 3 });
const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const list = (items, describe = (item) => item) => items.map(describe).join(", ");
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function party({ name, ideology, seats }) {
  const details = [ideology, seats == null ? null : `${seats} seats`].filter(Boolean);
  return details.length ? `${name} (${details.join(", ")})` : name;
}

const FORMATTERS = {
  "people.population": (value) => grouped.format(value),
  "economy.gdpUsd": (value) => `US$${compactUsd.format(value)}`,
  "economy.gdpPerCapitaUsd": (value) => `US$${grouped.format(Math.round(value))}`,
  "leadership.headOfState": officeHolder,
  "leadership.headOfGovernment": officeHolder,
  "leadership.nextNationalElection": ({ type, date }) => `${type}, ${date}`,
  "government.democracyScore": ({ score, index, scaleMin, scaleMax }) =>
    `${score} on a ${scaleMin}–${scaleMax} scale (${index})`,
  "government.recognitionStatus": ({ status, note }) => note ?? capitalize(status),
  "economy.topExports": (exports) => list(exports, (e) => `${e.product} (${e.sharePercent}%)`),
  "politics.majorParties": (parties) => list(parties, party),
};

function officeHolder({ name, title, since }) {
  return `${name}, ${title} (since ${since.slice(0, 4)})`;
}

// A field's value as text for the panel.
export function formatValue(fieldKey, value) {
  const format = FORMATTERS[fieldKey];
  if (format) return format(value);
  return Array.isArray(value) ? list(value) : String(value);
}

export function formatAsOf(isoDate) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${months[month - 1]} ${year}`;
}

// A field is stale when its last confirmation is older than its refresh
// window plus one day of grace (docs/adr/0005-freshness.md).
export function isStale(asOf, refreshDays, today = new Date()) {
  const age = Math.floor((today.getTime() - Date.parse(`${asOf}T00:00:00Z`)) / DAY);
  return age > refreshDays + 1;
}
