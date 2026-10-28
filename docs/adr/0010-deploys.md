# 0010. Deploys: data refreshed on the owner's Mac, code built by Cloudflare Pages from Git

- Status: Accepted
- Date: 2026-10-28
- Supersedes: the GitHub Actions `Daily refresh` and `Deploy web` workflows, and R2 storage

## Context

The first design ran the daily refresh in GitHub Actions. That put the storage keys and the Rails
master key in GitHub secrets, where every dependency a job installs could read them. The owner
prefers to keep secrets in 1Password on their own Mac, and already has a Linode Object Storage
bucket. Code deploys need no secrets at all.

## Decision

- **Code: Cloudflare Pages builds from Git.** The Pages project is connected to the repository.
  Pushes to `main` deploy to production, and other branches get previews. The build
  (`npm run build:pages` in `web/`) downloads the latest snapshot, checks that every country is
  selectable, and builds.
- **Data: `bin/refresh` on the owner's Mac.** launchd runs it at 07:00 local time
  (`bin/install-schedule`), from a detached checkout of `origin/main` that it updates first. Each
  run does five things:
  1. Refreshes the sources, keeping the database in object storage
     (`backend/bin/with-stored-database`).
  2. Checks every country is selectable.
  3. Archives the snapshot privately and copies it to `latest/` as the one public object.
  4. Triggers a Pages deploy hook.
  5. Opens GitHub issues for anything to review.
- **Secrets: 1Password.** The item `Global` in vault `LBPDEV` holds the secrets, read through a
  service account with `op run`.
  - The files in `deploy/` hold only `op://` references, and each command gets only the
    secrets it needs.
  - The service account token comes from the login Keychain when the environment lacks it.
  - GitHub and Cloudflare hold no secrets.
- **Storage: Linode, `s3://lbpdev/global/prod`.** The scripts use the aws CLI's standard
  settings, so any S3-compatible store works.

## Alternatives considered

- **GitHub Actions for the refresh:** runs whether or not the Mac is awake, but the secrets live
  in GitHub and are exposed to every dependency the job installs.
- **Direct upload from the Mac with wrangler:** needs a Cloudflare API token on the Mac and a
  site build there, and gives no previews per branch.
- **Committing each snapshot to Git:** the repository would grow every day for data that is
  already archived in the bucket.

## Consequences

- **The refresh needs the Mac awake.** A run missed while it sleeps happens at the next wake. A
  long absence leaves fields marked "may be outdated", and the heartbeat alerts, if configured.
- **`latest/data-v1.tar.gz` is public.** It holds the same data the site serves. The database,
  its backups and the archived snapshots stay private.
- **Pages deploys whatever reaches `main`.** Protect `main` so merges need CI.
- **The scheduled job runs only merged code.** Engine changes take effect once merged, and the
  published data always matches the reader on `main`.
- **The deploy scripts have no unit tests.** `bin/refresh`, `bin/install-schedule` and
  `web/scripts/fetch-snapshot.sh` are verified by real runs instead.
  `backend/bin/with-stored-database` does have specs.
