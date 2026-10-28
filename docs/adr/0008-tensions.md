# 0008. Tensions and conflicts: cited items from UCDP

- Status: Accepted
- Date: 2026-10-27
- Amended: 2026-10-28, adding the current year from UCDP's monthly candidate events

## Decision

- **The tension items are the content.** v1 shows only cited items; there is no AI-written
  summary (the owner's decision).
- **Sources:** two UCDP datasets, both CC BY 4.0 and both downloaded from the newest release
  linked on <https://ucdp.uu.se/downloads/>.
  - **The UCDP/PRIO Armed Conflict Dataset** (26.1 as of 2026-10-28) covers whole years, and
    its latest year is 2025. Every conflict active that year is listed under each country UCDP
    locates it in.
  - **The UCDP Candidate Events Dataset** is released monthly with at most a month's lag. The
    engine reads the January-to-date file (January–September 2026 as of 2026-10-28). Without
    it, a conflict that began in 2026 would not appear until the yearly release in mid-2027.
    One example is the conflict between Iran and Israel and the United States that UCDP's
    candidate data records from February 2026.
- **How this year's events become items:**
  - Only state-based violence counts (`type_of_violence` 1), so "armed conflict" means the
    same thing in both datasets.
  - Events are grouped by UCDP's conflict ID, and their best death estimates are summed.
    UCDP's own thresholds apply: under 25 deaths so far, the conflict is left out; at 1,000 or
    more, it is a war.
  - A conflict is listed under the countries of the governments fighting it, not every
    country where an event happened. Otherwise a single strike would mark a bystander, such
    as Sri Lanka.
  - Actors UCDP has not identified yet (`XXX` and a country number) count toward the deaths
    but are not named. The title comes from the deadliest pairing of identified sides. A
    conflict with no identified side is left out.
  - When both datasets have a conflict, this year's figures replace last year's.
- **Items keep UCDP's own wording:**
  - the sides ("Government of India vs Government of Pakistan over Kashmir");
  - each actor as a separate party;
  - the intensity as the source's label ("Minor armed conflict (25–999 battle-related deaths
    in 2025)" or "War (1,000+…)"). This year's are marked preliminary with the deaths so far
    ("War, preliminary (3,859 battle-related deaths in January–September 2026)");
  - in the yearly data, governments that sent troops to support a side (UCDP's secondary
    warring parties) are listed as parties, but the conflict is not listed under their
    countries;
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
- **This year's figures are preliminary.** UCDP revises candidate events before the yearly
  release, so counts can change. The item labels and the legend say so.
- **Early in a year, conflicts carry over from two years back.** In January 2027 the
  candidate file covers only January 2027, and the yearly dataset still ends with 2025, so
  2026's figures are missing until the yearly release adds them. Reopen this if UCDP keeps last
  year's full candidate file on its downloads page.
- **The refresh downloads about 13 MB a day** for the candidate file (it was 13 MB in October
  2026, and grows through the year).
