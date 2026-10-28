#!/usr/bin/env bash
# Downloads the latest published snapshot into data/v1, replacing what is there.
# Cloudflare's build runs it first (npm run build:pages), and bin/refresh runs it
# to check the public copy. SNAPSHOT_URL overrides the default.
set -euo pipefail

url="${SNAPSHOT_URL:-https://lbpdev.us-mia-1.linodeobjects.com/global/prod/latest/data-v1.tar.gz}"
cd "$(dirname "$0")/.."

download="$(mktemp)"
trap 'rm -f "$download"' EXIT
curl -fsSL --retry 3 -o "$download" "$url"

rm -rf data/v1
mkdir -p data
tar -xzf "$download" -C data
echo "Fetched snapshot $(node -p "require('./data/v1/manifest.json').snapshotId") from $url"
