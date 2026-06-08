#!/usr/bin/env bash
# Build a distributable tarball of Aura for Linux.
# Run from the repo root: bash scripts/make-package.sh
# Output: aura-<version>-linux.tar.gz in the repo root.
set -euo pipefail

cd "$(dirname "$0")/.."

VERSION=$(node -p "require('./package.json').version")
OUT="aura-${VERSION}-linux.tar.gz"

echo "==> Packaging Aura v${VERSION} → ${OUT}"

# Files/dirs to include (no node_modules, no build artifacts, no secrets, no git).
tar -czf "${OUT}" \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='dist-server' \
  --exclude='.env' \
  --exclude='data' \
  --exclude='scripts' \
  src \
  server \
  tests \
  public \
  index.html \
  package.json \
  package-lock.json \
  tsconfig.json \
  tsconfig.server.json \
  vite.config.ts \
  components.json \
  .env.example \
  install.sh \
  run.sh \
  2>/dev/null || true

# Verify public/ silently (it may not exist).
echo "==> Created ${OUT}"
echo "    Extract on your Linux machine with:"
echo "      tar -xzf ${OUT}"
echo "      cd aura   # (or wherever you extracted)"
echo "      bash install.sh"
echo "      bash run.sh"
