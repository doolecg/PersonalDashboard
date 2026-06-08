#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Checking Node.js..."
if ! command -v node &>/dev/null; then
  echo "Node.js not found. Install it from https://nodejs.org (v20+ recommended) then re-run this script."
  exit 1
fi

NODE_VER=$(node -e "process.stdout.write(process.versions.node)")
echo "    Node ${NODE_VER} found."

echo "==> Installing dependencies..."
npm ci --prefer-offline 2>/dev/null || npm install

echo "==> Building..."
npm run build

if [ ! -f .env ]; then
  cp .env.example .env
  echo ""
  echo "==> Created .env from .env.example."
  echo "    Edit it to add your API keys, then run ./run.sh to start Aura."
else
  echo "==> .env already exists — skipping."
fi

echo ""
echo "Done! Run ./run.sh to start Aura (default port 8080)."
