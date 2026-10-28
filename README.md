# Geopolitical Globe

A spinnable 3D globe where clicking any country opens a sourced, dated geopolitical profile.
Live at https://geopolitical-globe.pages.dev.

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
npm run lighthouse -- <url> [<url>...]   # performance and accessibility >= 90 (median of 3, desktop preset)
```

### Data for the reader

The reader serves the snapshot in `web/data/v1` (git-ignored), written by the backend:

```sh
cd backend
bin/rails db:seed data:refresh data:publish   # REST Countries key in credentials
cd ../web && npm run check:coverage            # every profiled country is clickable
```

The other backend tasks:

| Task | What it does |
|---|---|
| `bin/rails data:freshness` | Lists fields past their refresh window, writes `tmp/freshness.md`, and fails if any are stale |
| `bin/rails data:changes` | Lists leadership and ruling-party changes from the last day for a person to review |
| `bin/rails "data:spot_check[20]"` | Compares 20 random profiles' leaders and ruling party with Wikipedia infoboxes |

Sources, and why some candidates were not used, are recorded in `docs/adr/0006`–`0008`.
Editorial values with no structured source live in `backend/config/overrides.yml` and go
stale until re-reviewed.

`SNAPSHOT_DIR` points the reader at a different snapshot. The end-to-end tests use the
contract's example snapshot this way (`SNAPSHOT_DIR=../contracts/examples`).

### Rebuilding borders

`web/public/borders-50m.topo.json` is committed. Rebuild it only after upgrading Natural Earth:

```sh
cd web && node scripts/build-borders.js --simplify=12%
```

## Deployment

Code and data deploy separately (see `docs/adr/0010-deploys.md`):

- **Code:** Cloudflare Pages is connected to this repository. Every push to `main` deploys to
  production, and every other branch gets a preview. Its build runs `npm run build:pages` in
  `web/`: download the latest snapshot, check every country is selectable, build. Protect
  `main` so merges need CI to pass, because Pages deploys whatever reaches it.
- **Data:** `bin/refresh` runs daily at 07:00 on the owner's Mac. It refreshes the sources,
  checks the snapshot, archives it, makes it the public latest one, and triggers a Pages
  rebuild through a deploy hook. A run missed while the Mac sleeps happens at the next wake.

### Secrets

All secrets live in the 1Password item `Global` in vault `LBPDEV`. GitHub and Cloudflare hold
none. `bin/refresh` reads them through the 1Password service account with `op run`. The files
in `deploy/` hold only `op://` references, and each command gets only the secrets it needs.

| 1Password field | What |
|---|---|
| `storage_access_key_id`, `storage_secret_access_key` | Linode Object Storage key, for the database, backups and snapshots |
| `rails_master_key` | Decrypts `backend/config/credentials.yml.enc` (the REST Countries key) |
| `deploy_hook_url` | Cloudflare Pages deploy hook for `main` |
| `healthcheck_url` | Optional dead-man's-switch ping, e.g. healthchecks.io |

The service account token comes from `OP_SERVICE_ACCOUNT_TOKEN`, or from the login Keychain
when that is unset (as under launchd):

```sh
printf 'add-generic-password -U -a "%s" -s op-service-account-token -w "%s"\n' "$USER" "$OP_SERVICE_ACCOUNT_TOKEN" | security -i
```

### Storage

`deploy/settings.env` points at `s3://lbpdev/global/prod` on Linode (`us-mia-1`). Any
S3-compatible store works. The endpoint is the bare origin with no path, and the project's
folder goes in `STORAGE_URL`, because a path on the endpoint breaks listings.

| Path under `global/prod/` | What | Access |
|---|---|---|
| `engine/engine.sqlite3`, `engine/backups/` | The database and a copy from every successful run | Private |
| `snapshots/<id>/data-v1.tar.gz` | Every published snapshot | Private |
| `latest/data-v1.tar.gz` | The snapshot Cloudflare's build downloads | Public: the same data the site serves |

### Running it

```sh
bin/refresh --allow-empty --skip-deploy --skip-alerts   # first run only: start from an empty database
bin/refresh                     # what the schedule runs, in this checkout
bin/install-schedule            # install the 07:00 launchd job; needs bin/refresh on origin/main
launchctl kickstart gui/$(id -u)/dev.lbp.global.refresh   # run the scheduled job now
```

The scheduled job runs from its own checkout of `origin/main` in
`~/.local/share/global-refresh`, never from a working copy. It logs to
`~/Library/Logs/global/refresh.log`.

**Alerts:** a failed run, failed sources, leadership changes and stale fields each open a
GitHub issue, through the owner's `gh` login.

**Rollback:** copy an older `snapshots/<id>/data-v1.tar.gz` over `latest/data-v1.tar.gz` with
`--acl public-read`, then retry the latest production deployment in Cloudflare.

Borders: Made with Natural Earth.
