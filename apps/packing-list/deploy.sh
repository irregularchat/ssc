#!/usr/bin/env bash
set -euo pipefail

# Community Packing List - Deploy Script
# Deploys the React Router 7 app to Cloudflare Workers with D1 migrations
#
# Usage:
#   ./deploy.sh              # Full deploy (migrate + build + deploy)
#   ./deploy.sh --skip-migrate  # Skip DB migrations
#   ./deploy.sh --dry-run    # Build only, don't deploy

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SKIP_MIGRATE=false
DRY_RUN=false

for arg in "$@"; do
  case $arg in
    --skip-migrate) SKIP_MIGRATE=true ;;
    --dry-run) DRY_RUN=true ;;
    *) echo "Unknown arg: $arg"; exit 1 ;;
  esac
done

echo "========================================="
echo "  CPL Deploy - Community Packing List"
echo "========================================="
echo ""

# Step 1: Run D1 migrations (remote)
if [ "$SKIP_MIGRATE" = false ]; then
  echo "[1/4] Running D1 migrations (remote)..."
  npx wrangler d1 migrations apply cpl-db --remote
  echo "  Migrations applied."
else
  echo "[1/4] Skipping migrations (--skip-migrate)"
fi
echo ""

# Step 2: Build the app
echo "[2/4] Building React Router app..."
pnpm build
echo "  Build complete."
echo ""

# Step 3: Verify build output
echo "[3/4] Verifying build..."
if [ ! -d "build/client" ]; then
  echo "  ERROR: build/client directory not found!"
  exit 1
fi
if [ ! -f "build/server/index.js" ]; then
  echo "  ERROR: build/server/index.js not found!"
  exit 1
fi
CLIENT_FILES=$(find build/client -type f | wc -l | tr -d ' ')
echo "  build/client: ${CLIENT_FILES} files"
echo "  build/server: OK"
echo ""

# Step 4: Deploy to Cloudflare Workers
if [ "$DRY_RUN" = false ]; then
  echo "[4/4] Deploying to Cloudflare Workers..."
  npx wrangler deploy
  echo ""
  echo "  Deploy complete!"
else
  echo "[4/4] Dry run - skipping deploy"
fi
echo ""

# Step 5: Post-deploy verification
if [ "$DRY_RUN" = false ]; then
  echo "========================================="
  echo "  Post-Deploy Verification"
  echo "========================================="
  echo ""
  sleep 3
  TITLE=$(curl -sL "https://packinglist.soldiersupportcenter.com" | grep -o '<title>[^<]*</title>' || echo "FAILED")
  echo "  Title: $TITLE"
  if echo "$TITLE" | grep -qi "Community Packing List"; then
    echo "  Status: VERIFIED"
  else
    echo "  Status: WARNING - unexpected title, check manually"
  fi
fi

echo ""
echo "Done."
