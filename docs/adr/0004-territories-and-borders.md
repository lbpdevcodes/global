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
  drawn as a translucent amber overlay with an outline, and hovering shows Natural Earth's own
  note ("Admin. by X; Claimed by Y") labeled "Natural Earth, 2022". A hatch pattern was tried,
  but globe.gl's polygon caps have no texture coordinates to map it onto. A click on an overlay
  selects the country underneath it.

## Resolved in M1

- **Unprofiled breakaway features** N. Cyprus (CYN), Somaliland (SOL), Siachen Glacier (KAS) and
  Antarctica (ATA) are **not selectable**. Their disputed-area overlays still explain them.
  `web/scripts/borders/coverage.js` lists them, and `npm run check:coverage` fails on any border
  code that is neither indexed nor on that list.
- **The Natural Earth 2022 vintage:** upstream has not changed these files since May 2022, which
  was checked on 2026-10-27. Reviewed local overrides in
  `web/scripts/borders/disputed-overrides.js` withdraw these areas, each with its reason:
  - Artsakh, dissolved in January 2024;
  - the Donetsk and Luhansk "People's Republics", whose 2022 outlines and "Self admin." notes
    predate later changes.

  **The owner should review this list.**
