// Reviewed corrections to Natural Earth v5.1.2's disputed-areas layer (May
// 2022), which upstream has not updated since (docs/adr/0004). Each entry
// withdraws an area whose outline or note no longer describes the situation.
// Keyed by Natural Earth's BRK_A3 id.
export const WITHDRAWN = {
  B38: "Artsakh (Nagorno-Karabakh): the self-declared republic dissolved on 1 January 2024.",
  C02: "Donetsk People's Republic: the 2022 outline and 'Self admin.' note predate later changes in control.",
  C03: "Luhansk People's Republic: the 2022 outline and 'Self admin.' note predate later changes in control.",
};

export function applyDisputedOverrides(features) {
  return features.filter((feature) => !(feature.properties.id in WITHDRAWN));
}
