#!/usr/bin/env bash
set -euo pipefail

# LokaTalenta Deploy CLI
# Usage:
#   ./scripts/deploy.sh dev            # Lint, test, build (dev env) & deploy via Vercel CLI (Preview/Dev)
#   ./scripts/deploy.sh prod           # Lint, test, build (prod env) & deploy via Vercel CLI (Production)
#   ./scripts/deploy.sh dev --push     # Push branch dev to origin (triggers GitHub Actions auto-deploy)
#   ./scripts/deploy.sh prod --push    # Push branch prod to origin (triggers GitHub Actions auto-deploy)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_DIR="$ROOT_DIR/client"

TARGET="${1:-}"
MODE_FLAG="${2:-}"

if [[ "$TARGET" != "dev" && "$TARGET" != "prod" ]]; then
  echo "Usage: $0 <dev|prod> [--push]"
  exit 1
fi

if [[ "$MODE_FLAG" == "--push" ]]; then
  echo "Pushing branch '$TARGET' to origin to trigger auto-deploy..."
  cd "$ROOT_DIR"
  git push origin "$TARGET"
  echo "Done. Check GitHub Actions for auto-deploy progress."
  exit 0
fi

cd "$CLIENT_DIR"

echo "==> [1/4] Running lint & unit tests..."
npm run lint
npm test

if [[ "$TARGET" == "prod" ]]; then
  echo "==> [2/4] Building client (mode: production)..."
  npx tsc -b && npx vite build --mode production
  echo "==> [3/4] Deploying to Vercel (Production)..."
  npx --yes vercel deploy --prod
else
  echo "==> [2/4] Building client (mode: development)..."
  npx tsc -b && npx vite build --mode development
  echo "==> [3/4] Deploying to Vercel (Dev / Preview)..."
  npx --yes vercel deploy
fi

echo "==> [4/4] Deploy '$TARGET' completed."
