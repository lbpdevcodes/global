# 0004. Borders, territories and disputed areas

- Status: Accepted (open items noted)
- Date: 2026-10-27

## Decision

- **Borders** come from Natural Earth 1:50m v5.1.2 (public domain), built by
  `web/scripts/build-borders.js` and committed. At 12% simplification the file is about
  54 KB gzipped.
- **The borders file is politics-free.** Each feature carries only a stable `code`:
  - `ISO_A3_EH`, falling back to `ADM0_A3`;
  - Natural Earth's `-99` sentinel (on France's and Norway's `ISO_A3`) is ignored;
  - `KOS` maps to `XKX`.

  What a code means comes from the reviewed index data, not from geometry.
- **Non-UN territories fold into their parent country.** Greenland, Puerto Rico, Hong Kong and
  about 40 others are `territory` rows in the index with a `parent`. Clicking one, or opening
  `/country/GRL`, centers the globe on it and opens the parent's profile with a note.
- **Disputed and breakaway areas** come from Natural Earth's breakaway/disputed layer. They are
  drawn as a hatched overlay showing Natural Earth's own note ("Admin. by X; Claimed by Y") as a
  sourced, dated statement.

## Open items (decide in M1)

- **Unprofiled breakaway features in the admin-0 layer** are N. Cyprus (CYN), Somaliland (SOL),
  Siachen Glacier (KAS) and Antarctica (ATA). They need an explicit index treatment: selectable
  with a note pointing to the claimant's profile, or not selectable.
- **Natural Earth v5.1.2 dates from May 2022.** Its disputed layer still includes Artsakh, and
  its Donetsk and Luhansk outlines predate later changes. Choose between pinning a newer upstream
  commit and keeping reviewed local overrides.
