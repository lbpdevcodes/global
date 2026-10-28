# 0001. Two halves joined by a contract: Rails + SQLite engine, static React reader

- Status: Accepted
- Date: 2026-10-27

## Context

The PRD describes two systems with different shapes. The public reader is read-only,
latency-sensitive, and must be JavaScript because the globe is WebGL. The data engine is a
stateful batch job that ingests about eight sources, and it is where the likely v2 features
land: accounts, comments, editing, a history slider, subnational data and more layers.
The owner builds in Rails and wants v1 small, but without a rewrite when requirements grow.

## Decision

- **Reader:** React (JavaScript, no TypeScript) on React Router v8 framework mode, with
  `ssr: false` plus `prerender`. Country pages can be pre-rendered for share previews and SEO
  through configuration, with no rewrite. globe.gl sits behind our own interface. The reader is
  served as static files from Cloudflare Pages, so no server runs at read time.
- **Engine:** Rails 8.1 on SQLite. In v1 it is not a server. A scheduled job (on the owner's Mac
  since 2026-10-28, ADR 0010) runs rake tasks through `bin/with-stored-database`, which fetches the database file from an
  S3-compatible bucket and uploads it, with a dated backup, only after a successful run.
- **Seam:** a versioned JSON contract (ADR 0002). The reader knows nothing but the published files.

## Alternatives considered

- **All TypeScript:** one language, but v2 auth, admin, jobs and mail would be assembled by hand.
- **Rails monolith serving the globe:** needs a server running at all times, which breaks the
  free-tier and no-server goals.
- **Postgres:** a hosted service with credentials and a free tier that can disappear. Its benefits
  only matter with several app servers or heavy concurrent writes.

## Consequences

- There are two toolchains (Ruby, Node). The contract keeps them independent.
- SQLite has a single writer, which suits a daily batch. Later, a single Kamal-deployed VPS with
  Litestream backups to the same bucket adds a web role.
- 2026-10-28: storage moved from Cloudflare R2 to the owner's existing Linode Object Storage
  bucket, under its own folder (`s3://lbpdev/global/prod`). The scripts use the aws CLI's
  standard settings, so any S3-compatible store works.
- To keep a later move to Postgres a schema tweak, use JSON columns and avoid Postgres-only
  features.
- `public/_redirects` sends `/country/*` to `/__spa-fallback`, without `.html`, because Pages 308s
  a rewrite that targets a `.html` file (found in the M0 spike).
