#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d dist-server ]; then
  echo "dist-server/ not found. Run ./install.sh first."
  exit 1
fi

exec node dist-server/index.js
