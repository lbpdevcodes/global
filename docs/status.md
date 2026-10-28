# v1 status against the PRD's milestones (2026-10-27)

This records what has been verified and how, and what has not.

| Milestone | Acceptance criterion | Status | Evidence |
|---|---|---|---|
| M1 | Every UN member clickable; `/country/FRA` deep links | **Met** | `npm run check:coverage` (198/198 selectable); e2e deep links FRA, XKX, GRL→DNK, ZZZ |
| M1 | Panel opens in < 300 ms | **Met** | e2e measures 99–113 ms |
| M2 | 198 files validate; every field has source and as-of | **Met** | Every publish validates each file against `contracts/v1` and aborts on any failure |
| M2 | Daily workflow green 3 days running | **Not yet** | `daily-refresh.yml` is built and its cycle passes locally in production mode, but it needs Cloudflare Pages and the storage settings to run (README "Deployment") |
| M3 | 20-country spot check against Wikipedia | **Pending** | `data:spot_check` is built and tested. Wikipedia answered 503 to every request on 2026-10-27, so rerun `bin/rails "data:spot_check[20]"` |
| M4 | No tension item lacks a citation | **Met** | Every item carries `sourceUrl`; the contract requires it |
| M4 | Layers render in < 500 ms | **Met** | 171–270 ms with real data, including the next frame in software WebGL |
| M4 | Lighthouse ≥ 90 for performance and accessibility | **Met (desktop)** | Medians 93 and 98 for performance, 100 for accessibility. The mobile preset scores 70 and 57: see ADR 0009 |

## Deliberate gaps

| Gap | Reason | Where recorded |
|---|---|---|
| Top trade partners | OEC's terms forbid redistribution | ADR 0006 |
| Major parties and seats | Wikidata's seat data is stale and ambiguous | ADR 0007 |
| "Tension" and "dispute" items | No openly licensed source yet | ADR 0008 |
| Hatched disputed areas | globe.gl caps have no texture coordinates, so a tint plus outline is used | ADR 0004 |

## Needs the owner

| Item | What to do |
|---|---|
| Cloudflare Pages and storage settings | See README "Deployment" |
| Disputed-area withdrawals | Review the list in `web/scripts/borders/disputed-overrides.js` |
| Recognition notes | Review the wording in `backend/config/overrides.yml` |
| REST Countries key | Rotate it if the conversation it was shared in is shared further |
