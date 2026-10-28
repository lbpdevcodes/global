# Contract examples

A mini snapshot shaped exactly like a published one: `manifest.json`, `index.json`
and `countries/{CODE}.json`. Both test suites validate it against `../v1/*.schema.json`.
From M1 the reader's unit and end-to-end tests also use it as their data, so reader CI
needs no Ruby or database.

**This is fixture data, not a source of truth.** Values are illustrative; many fields
are deliberately null so the reader's "hide empty rows" path is exercised.

Coverage: FRA (every field type populated), NLD (the "Holland" search alias), DNK with a
GRL territory row, XKX and TWN (partially recognized; TWN carries a tensions item).
