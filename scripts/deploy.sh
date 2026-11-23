#!/usr/bin/env bash
set -euo pipefail

# LokaTalenta Unified CLI (Backend & Frontend)
# Usage:
#   ./scripts/deploy.sh <dev|prod> [fe|be|all] [--push]
#
# Examples:
#   ./scripts/deploy.sh dev fe            # Lint, test, build (dev env) & deploy via Vercel CLI
#   ./scripts/deploy.sh prod fe           # Lint, test, build (prod env) & deploy via Vercel CLI
#   ./scripts/deploy.sh dev be            # Run idempotent seed against Dev Supabase (requires SUPABASE_SERVICE_ROLE_KEY)
#   ./scripts/deploy.sh prod be           # Run idempotent seed against Prod Supabase (requires SUPABASE_SERVICE_ROLE_KEY)
#   ./scripts/deploy.sh dev fe --push     # Push dev branch to GitHub (triggers CI + Vercel Dev auto-deploy)
#   ./scripts/deploy.sh prod fe --push    # Push prod branch to GitHub (triggers CI + Vercel Prod auto-deploy)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_DIR="$ROOT_DIR/client"

TARGET="${1:-}"
SCOPE="${2:-fe}"
MODE_FLAG="${3:-}"

if [[ "$SCOPE" == "--push" ]]; then
  MODE_FLAG="--push"
  SCOPE="fe"
fi

if [[ "$TARGET" != "dev" && "$TARGET" != "prod" ]]; then
  echo "Usage: $0 <dev|prod> [fe|be|all] [--push]"
  exit 1
fi

if [[ "$SCOPE" != "fe" && "$SCOPE" != "be" && "$SCOPE" != "all" ]]; then
  echo "Invalid scope '$SCOPE'. Choose: fe | be | all"
  exit 1
fi

run_backend() {
  echo "==> [BE] Syncing Supabase backend for '$TARGET'..."
  local env_file="$CLIENT_DIR/.env.development"
  if [[ "$TARGET" == "prod" ]]; then
    env_file="$CLIENT_DIR/.env.production"
  fi

  if [[ ! -f "$env_file" ]]; then
    echo "Error: Missing $env_file (create it from ${env_file}.example)."
    exit 1
  fi

  local supa_url
  supa_url="$(grep '^VITE_SUPABASE_URL=' "$env_file" | cut -d'=' -f2-)"
  if [[ -z "$supa_url" ]]; then
    echo "Error: VITE_SUPABASE_URL not found in $env_file"
    exit 1
  fi

  if [[ -n "${SUPABASE_DB_URL:-}" ]] && command -v psql >/dev/null 2>&1; then
    echo "==> [BE] Applying SQL migrations via psql..."
    for f in "$ROOT_DIR"/supabase/migrations/*.sql; do
      echo "  -> $(basename "$f")"
      psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f "$f"
    done
  else
    echo "==> [BE] Skipping psql migrations (set SUPABASE_DB_URL and install psql to push SQL via CLI)."
  fi

  if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]]; then
    echo "==> [BE] Running idempotent seeder on $supa_url..."
    cd "$CLIENT_DIR"
    NODE_PATH="$CLIENT_DIR/node_modules" \
      SUPABASE_URL="$supa_url" \
      SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
      npx --yes tsx ../supabase/seed/seedSupabase.ts
  else
    echo "==> [BE] Skipping seed (export SUPABASE_SERVICE_ROLE_KEY to seed $TARGET)."
  fi
}

run_frontend() {
  if [[ "$MODE_FLAG" == "--push" ]]; then
    echo "==> [FE] Pushing branch '$TARGET' to origin (triggers GitHub CI & Vercel auto-deploy)..."
    cd "$ROOT_DIR"
    git push origin "$TARGET"
    echo "==> [FE] Push completed."
    return 0
  fi

  cd "$CLIENT_DIR"
  echo "==> [FE 1/3] Running lint & unit tests..."
  npm run lint
  npm test

  if [[ "$TARGET" == "prod" ]]; then
    echo "==> [FE 2/3] Building client (mode: production)..."
    npx tsc -b && npx vite build --mode production
    echo "==> [FE 3/3] Deploying to Vercel (Production)..."
    npx --yes vercel deploy --prod
  else
    echo "==> [FE 2/3] Building client (mode: development)..."
    npx tsc -b && npx vite build --mode development
    echo "==> [FE 3/3] Deploying to Vercel (Dev / Preview)..."
    npx --yes vercel deploy
  fi
}

if [[ "$SCOPE" == "be" || "$SCOPE" == "all" ]]; then
  run_backend
fi

if [[ "$SCOPE" == "fe" || "$SCOPE" == "all" ]]; then
  run_frontend
fi

echo "==> Done ($TARGET / $SCOPE)."
