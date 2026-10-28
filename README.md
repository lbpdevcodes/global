# Geopolitical Globe

A spinnable 3D globe where clicking any country opens a sourced, dated geopolitical profile.

Two halves joined by a versioned JSON contract (see `docs/adr/0001-stack.md`):

| Directory | What | Stack |
|---|---|---|
| `web/` | Public reader, static on Cloudflare Pages | React Router v8 (JS), globe.gl, Tailwind |
| `backend/` | Data engine: ingest, history, publish | Rails 8.1, SQLite |
| `contracts/` | JSON Schemas for published files, plus an example snapshot | JSON Schema 2020-12 |
| `docs/` | Decisions (`adr/`) and spike results (`spikes/`) | |

## Setup

Requirements: Ruby 4.0.7 (pinned in `mise.toml`), Node 26 (`.node-version`), and the `sqlite3`
command-line tool.

```sh
# Backend
cd backend
bundle install
bin/rails db:prepare
bundle exec rspec          # specs; network access is blocked
bundle exec standardrb     # lint

# Reader
cd web
npm ci
npx playwright install chromium   # once, for end-to-end tests
npm run dev                # http://localhost:5173, serving the snapshot in web/data/v1
npm test                   # unit and contract tests (Vitest)
npm run test:e2e           # builds, serves through Cloudflare's local Pages runtime, runs Playwright
npm run lint
```

### Data for the reader

The reader serves the snapshot in `web/data/v1` (git-ignored), written by the backend:

```sh
cd backend
bin/rails db:seed data:refresh data:publish   # REST Countries key in credentials
cd ../web && npm run check:coverage            # every profiled country is clickable
```

`SNAPSHOT_DIR` points the reader at a different snapshot. The end-to-end tests use the
contract's example snapshot this way (`SNAPSHOT_DIR=../contracts/examples`).

### Rebuilding borders

`web/public/borders-50m.topo.json` is committed. Rebuild it only after upgrading Natural Earth:

```sh
cd web && node scripts/build-borders.js --simplify=12%
```

## Deployment

Two workflows deploy to Cloudflare Pages, and both share one concurrency group:
- **`Daily refresh`** (05:15 UTC) refreshes the sources, publishes and archives a snapshot to
  R2, then builds and deploys.
- **`Deploy web`** ships code that passed `CI web`, using the latest snapshot.

Both stay skipped until these are set in the GitHub repository:

| Kind | Name | What |
|---|---|---|
| Variable | `PAGES_PROJECT` | Cloudflare Pages project name |
| Variable | `R2_BUCKET`, `R2_ENDPOINT` | R2 bucket and `https://<account>.r2.cloudflarestorage.com` |
| Secret | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID` | Pages deploys |
| Secret | `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` | R2 access key for the database, snapshots and backups |
| Secret | `RAILS_MASTER_KEY` | Contents of `backend/config/master.key` (decrypts the REST Countries key) |
| Secret | `HEALTHCHECK_URL` | Optional dead-man's-switch ping, e.g. healthchecks.io |

**First run:** trigger `Daily refresh` by hand with "start from an empty database" ticked. Every
later run refuses to start if the stored database cannot be fetched.

**Alerts:** failed sources and stale fields open a GitHub issue.

**Rollback:** sync an older `snapshots/<id>/data/v1` over `latest/data/v1` in R2, then re-run
`Deploy web`.

Borders: Made with Natural Earth.
