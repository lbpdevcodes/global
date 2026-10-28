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
npm run dev                # http://localhost:5173
npm test                   # unit and contract tests (Vitest)
npm run test:e2e           # builds, serves through Cloudflare's local Pages runtime, runs Playwright
npm run lint
```

### Rebuilding borders

`web/public/borders-50m.topo.json` is committed. Rebuild it only after upgrading Natural Earth:

```sh
cd web && node scripts/build-borders.js --simplify=12%
```

## Deployment

The `Deploy web` workflow publishes commits that passed `CI web` to Cloudflare Pages. It is
skipped until these are set in the GitHub repository:

- the variable `PAGES_PROJECT` (the Pages project name);
- the secrets `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.

Borders: Made with Natural Earth.
