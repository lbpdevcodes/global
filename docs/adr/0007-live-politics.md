# 0007. Live politics from Wikidata

- Status: Accepted
- Date: 2026-10-27

## Decision

| Field | Rule |
|---|---|
| Head of state / government | P35 / P6 statements with no end date. **Holder selection:** Wikidata often never closes former holders (Luxembourg lists 18 "current" prime ministers), so a preferred-rank statement wins, then the latest start date. Several undated holders resolve to nobody rather than a guess. The title is the office's label (P1906 / P1313). The start date (P580) may be absent, so `since` is nullable in the contract. |
| Ruling party or coalition | The head of government's current parties (P102). This is a documented approximation: coalitions are not modeled, and a non-partisan head of government leaves the field empty. |
| Next national election | The earliest dated election (P585 in the future) whose **jurisdiction (P1001) is the country itself**, which excludes state, county and council elections, and whose type descends from presidential, general or legislative election. A type under several bases is labeled by priority: Presidential, General, Legislative. Year- or month-precision dates keep only that precision. Countries are queried in batches of 50, because one query for all of them took 40–65 s against the service's 60 s limit. |
| Alliances | Current P463 memberships in a fixed list of 24 alliances and blocs, shown by short name with the UN first. The QIDs were checked against live membership counts (a remembered "CSTO" QID turned out to be the Asian Development Bank). |
| Major parties and seats | **Not published in v1.** Wikidata's P1410 seat counts carry several stale values with no end dates, mix parliamentary groups with parties, and pick ideologies arbitrarily. Revisit with ParlGov, the PRD's fallback. |

## Review and checks

- **`bin/rails data:changes`** lists leadership and ruling-party changes from the last day. The
  daily refresh opens an issue so a person reviews each one.
- **`bin/rails "data:spot_check[20]"`** compares 20 random profiles with Wikipedia: leaders
  against the country's infobox, and the ruling party against the head of government's infobox.
  The result is written to `tmp/spot-check.md`. A country whose article cannot be fetched is
  reported as unverifiable.

## Coverage on 2026-10-27

| Field | Profiles with a value (of 198) |
|---|---|
| Head of state | 196 |
| Head of government | 191 |
| Ruling party | 149 |
| Alliances | 194 |
| Next national election | 63 |
