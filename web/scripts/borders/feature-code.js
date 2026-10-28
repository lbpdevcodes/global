const MISSING = "-99";

// Natural Earth codes that differ from the codes our data uses.
const ALIASES = { KOS: "XKX" };

// The stable code for a Natural Earth admin-0 feature. What the code means
// (a profiled state, a territory with a parent, a disputed area) is decided by
// the published index, not by the borders file.
export function featureCode({ ISO_A3_EH, ADM0_A3 }) {
  const code = ISO_A3_EH !== MISSING ? ISO_A3_EH : ADM0_A3;
  return ALIASES[code] ?? code;
}
