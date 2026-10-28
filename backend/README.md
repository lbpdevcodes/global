# Data engine

Rails 8.1 on SQLite. It ingests sources, keeps every observed value, and publishes snapshots
that conform to `../contracts/v1`. In v1 it runs as a scheduled job, not a server. See
`../docs/adr/0001-stack.md` and the setup steps in `../README.md`.

`bin/with-stored-database <command>` runs a command against the database kept in
`DATABASE_STORE` (an `s3://` path in any S3-compatible store, or a local directory). It uploads the database back only
if the command succeeds.
