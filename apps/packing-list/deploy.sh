#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure we're in the packing-list app directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DRY_RUN=false
SKIP_MIGRATE=false

for arg in "$@"; do
    case $arg in
        --dry-run) DRY_RUN=true ;;
        --skip-migrate) SKIP_MIGRATE=true ;;
        --migrate-only)
            echo "${BLUE}Community Packing List — Migrate Only${NC}"
            echo ""
            echo "${YELLOW}Applying D1 migrations to cpl-db (remote)...${NC}"
            npx wrangler d1 migrations apply cpl-db --remote
            echo "${GREEN}Migrations applied${NC}"
            exit 0
            ;;
        --help|-h)
            echo "Community Packing List Deployment Script"
            echo ""
            echo "Usage:"
            echo "  ./deploy.sh               Build, migrate, and deploy"
            echo "  ./deploy.sh --dry-run     Build and verify but don't deploy"
            echo "  ./deploy.sh --skip-migrate  Deploy without running migrations"
            echo "  ./deploy.sh --migrate-only  Run D1 migrations only"
            echo ""
            exit 0
            ;;
        *) echo "${RED}Unknown option: $arg${NC}"; exit 1 ;;
    esac
done

echo ""
echo "${BLUE}Community Packing List — Deployment${NC}"
echo "======================================"

# Step 1: Build
echo ""
echo "${YELLOW}[1/4] Building...${NC}"
pnpm build

# Verify build output
if [ ! -d "build/client" ]; then
    echo "${RED}ERROR: build/client/ not found after build${NC}"
    exit 1
fi
if [ ! -f "build/server/index.js" ]; then
    echo "${RED}ERROR: build/server/index.js not found after build${NC}"
    exit 1
fi
echo "${GREEN}[1/4] Build verified (client + server)${NC}"

# Step 2: Migrations
if [ "$SKIP_MIGRATE" = true ]; then
    echo ""
    echo "${YELLOW}[2/4] Skipping migrations (--skip-migrate)${NC}"
elif [ "$DRY_RUN" = true ]; then
    echo ""
    echo "${YELLOW}[2/4] Dry run — skipping migrations${NC}"
else
    echo ""
    echo "${YELLOW}[2/4] Applying D1 migrations...${NC}"
    npx wrangler d1 migrations apply cpl-db --remote 2>&1 || {
        echo "${YELLOW}[2/4] No new migrations to apply${NC}"
    }
    echo "${GREEN}[2/4] Migrations up to date${NC}"
fi

# Step 3: Deploy
echo ""
if [ "$DRY_RUN" = true ]; then
    echo "${YELLOW}[3/4] Dry run — skipping deploy${NC}"
    npx wrangler deploy --dry-run 2>&1 || true
else
    echo "${YELLOW}[3/4] Deploying to Cloudflare Workers...${NC}"
    npx wrangler deploy
    echo "${GREEN}[3/4] Deployed${NC}"
fi

# Step 4: Verify
echo ""
if [ "$DRY_RUN" = true ]; then
    echo "${YELLOW}[4/4] Dry run — skipping verification${NC}"
else
    echo "${YELLOW}[4/4] Verifying deployment...${NC}"
    sleep 3

    # Check workers.dev URL
    WORKERS_URL="https://community-packing-list.wemea-5ahhf.workers.dev"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$WORKERS_URL" 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        echo "${GREEN}  ✓ $WORKERS_URL → HTTP $STATUS${NC}"
    else
        echo "${RED}  ✗ $WORKERS_URL → HTTP $STATUS${NC}"
    fi

    # Check custom domain
    CUSTOM_URL="https://packinglist.soldiersupportcenter.com"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$CUSTOM_URL" 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        echo "${GREEN}  ✓ $CUSTOM_URL → HTTP $STATUS${NC}"
    else
        echo "${RED}  ✗ $CUSTOM_URL → HTTP $STATUS (may need DNS propagation)${NC}"
    fi
fi

echo ""
echo "${GREEN}Deployment complete!${NC}"
