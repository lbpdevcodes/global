# 0002. Published contract v1

- Status: Accepted
- Date: 2026-10-27

## Decision

- `contracts/v1/*.schema.json` (JSON Schema 2020-12) is the single, language-neutral source of
  truth for `manifest.json`, `index.json` and `countries/{CODE}.json`.
- **Every fact is sourced.** It is `{value, source, asOf, period?}` or `null`.
  - `asOf` is when the value was last confirmed from its source (ADR 0005).
  - `period` is the year the data describes, for example `"2024"` for a population figure.
    It replaces the PRD's separate `populationYear` and `year` fields.
  - Unknown values are `null`, and the reader hides those rows.
- `index.json` carries every entity's names, aliases, kind, parent, centroid, recognition and the
  four layer values. Search and layers need all entities before any click.
- **Versioning:** the path carries the major version (`/data/v1/`). `manifest.schemaVersion` is
  `1.x` and only ever gains optional fields within v1.
- **Enforcement:**
  - The engine validates every file with `json_schemer` before publishing. An invalid file aborts
    the publish.
  - The reader's tests validate the same `contracts/examples/` mini snapshot with Ajv and use it
    as fixtures.

## Consequences

- A schema change that breaks either side fails that side's CI.
- Reader CI never needs Ruby or a database.
