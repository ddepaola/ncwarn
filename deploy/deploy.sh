#!/usr/bin/env bash
# Build + (re)start the NC Risk Radar stack on the VPS. Run from /home/ncwarn/nc-risk-radar.
# Usage: ./deploy/deploy.sh [--no-cache]
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .env ] || { echo ".env missing (copy .env.example)"; exit 1; }
export APP_VERSION="$(git rev-parse --short HEAD 2>/dev/null || echo dev)"
echo "Building ncriskradar @ $APP_VERSION"
docker compose build ${1:-} --build-arg APP_VERSION="$APP_VERSION"
docker compose up -d --remove-orphans
echo "Waiting for health..."
for i in $(seq 1 20); do
  if curl -fsS http://127.0.0.1:3020/api/health >/dev/null 2>&1; then echo "web healthy"; break; fi; sleep 3
done
docker compose ps
curl -sS http://127.0.0.1:3020/api/health; echo
