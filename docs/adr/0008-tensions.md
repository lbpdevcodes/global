# 0008. Tensions and conflicts: cited items from UCDP

- Status: Accepted
- Date: 2026-10-27

## Decision

- **The tension items are the content.** v1 shows only cited items; there is no AI-written
  summary (the owner's decision).
- **Source:** the UCDP/PRIO Armed Conflict Dataset (CC BY 4.0). The engine downloads the
  newest release linked from <https://ucdp.uu.se/downloads/>, which is 26.1 as of 2026-10-27,
  and lists every conflict active in the dataset's latest year under each country where it is
  fought.
- **Items keep UCDP's own wording:**
  - the sides ("Government of India vs Government of Pakistan over Kashmir");
  - each actor as a separate party;
  - the intensity as the source's label ("Minor armed conflict (25–999 battle-related deaths
    in 2025)" or "War (1,000+…)");
  - a link to the conflict's UCDP page.
- **"None recorded" is real data.** Every matched country gets a list, possibly empty, so the
  conflict layer can show "none recorded" as a confirmed value rather than missing data.
- **Location names are matched against our own names and aliases.** A former name in
  parentheses ("Myanmar (Burma)") is ignored, and unmatched names are logged. All 37 locations
  in 26.1 matched.
- **Freshness:** the conflict list is watched on a 1-day window, so a failing download alerts.

## Not used, and why

| Candidate | Reason |
|---|---|
| UCDP API | Requires an access token (`x-ucdp-access-token`). The dataset download does not. |
| ACLED | Needs an account, and its terms restrict republishing event data. |
| Crisis Group CrisisWatch, CFR Global Conflict Tracker | No API. Terms for scraping were not reviewed. |
| Wikidata territorial disputes | None of the current items link participant countries (P710), checked 2026-10-27. |

## Consequence

- **The conflict layer currently has two classes:** active armed conflict, and none recorded.
  The contract's "tension" and "dispute" statuses stay available for a future source, such as
  CrisisWatch once its terms are reviewed.
- **Disputed territories remain visible on the map** with Natural Earth's notes (ADR 0004).
