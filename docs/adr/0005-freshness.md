# 0005. Freshness: what asOf means and when a field is stale

- Status: Accepted
- Date: 2026-10-27

## Decision

- `asOf` is the date a value was **last confirmed from its source**. The year the data
  describes goes in `period`.
- **When a source fetch fails,** the last good value is kept and its `asOf` stops advancing.
- **Stale** means `today - asOf > refresh window + 1 day`. Refresh windows live in
  `config/fields.yml`: daily 1, weekly 7, monthly 31, yearly 366. Stale fields show
  "may be outdated".
- **Alert** when any field is stale. `bin/rails data:freshness` writes `tmp/freshness.md` and
  exits non-zero, and the daily workflow opens a GitHub issue. Alerting at the first stale day
  leaves a week to fix it within the PRD's "never more than 7 days stale" bar.
- **Editorial overrides** are dated by their review (ADR 0006), so they go stale and prompt a
  re-review.
- **Every source must be fetchable by the daily job.** A source that can't be, such as a manual
  dataset import, needs a documented exception here.

## Consequences

- A yearly figure, such as population for 2024, can be fresh, because it was confirmed yesterday
  even though it describes a past year.
- A scheduled job that silently stops is caught by an external heartbeat, not by the job itself.
