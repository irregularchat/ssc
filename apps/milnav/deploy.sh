#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure we're in the milnav app directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DEPLOY_API=false
DEPLOY_WEB=false
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        --api) DEPLOY_API=true ;;
        --web) DEPLOY_WEB=true ;;
        --all) DEPLOY_API=true; DEPLOY_WEB=true ;;
        --dry-run) DRY_RUN=true ;;
        --help|-h)
            echo "MilNav Deployment Script"
            echo ""
            echo "Usage:"
            echo "  ./deploy.sh          Deploy both API and Web (default)"
            echo "  ./deploy.sh --api    Deploy only the API Worker"
            echo "  ./deploy.sh --web    Deploy only the Web Frontend"
            echo "  ./deploy.sh --dry-run  Build and verify but don't deploy"
            echo ""
            exit 0
            ;;
        *) echo "${RED}Unknown option: $arg${NC}"; exit 1 ;;
    esac
done

# Default: deploy both if neither --api nor --web specified
if [ "$DEPLOY_API" = false ] && [ "$DEPLOY_WEB" = false ]; then
    DEPLOY_API=true
    DEPLOY_WEB=true
fi

echo ""
echo "${BLUE}MilNav — Deployment${NC}"
echo "========================="

# Deploy API Worker
if [ "$DEPLOY_API" = true ]; then
    echo ""
    echo "${YELLOW}[API] Deploying Worker...${NC}"

    if [ "$DRY_RUN" = true ]; then
        echo "${YELLOW}[API] Dry run — skipping deploy${NC}"
        npx wrangler deploy --dry-run 2>&1 || true
    else
        npx wrangler deploy
    fi

    echo "${GREEN}[API] Worker deployed${NC}"

    # Verify
    if [ "$DRY_RUN" != true ]; then
        echo "${YELLOW}[API] Verifying...${NC}"
        sleep 2
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://milnav.gitayam.workers.dev/api/health" 2>/dev/null || echo "000")
        if [ "$STATUS" = "200" ]; then
            echo "${GREEN}[API] ✓ Health check returned HTTP $STATUS${NC}"
        else
            echo "${RED}[API] ✗ Health check returned HTTP $STATUS${NC}"
        fi
    fi
fi

# Deploy Web Frontend
if [ "$DEPLOY_WEB" = true ]; then
    echo ""
    echo "${YELLOW}[Web] Building frontend...${NC}"
    cd web
    pnpm install --frozen-lockfile 2>/dev/null || pnpm install
    pnpm run build

    # Verify build output
    if [ ! -f "dist/index.html" ]; then
        echo "${RED}[Web] ERROR: dist/index.html not found after build${NC}"
        cd ..
        exit 1
    fi

    if grep -q 'src="/src/main.tsx"' dist/index.html 2>/dev/null; then
        echo "${RED}[Web] ERROR: dist/index.html has development script tag${NC}"
        cd ..
        exit 1
    fi
    echo "${GREEN}[Web] Build verified${NC}"

    # Copy Pages Functions into dist so they get deployed
    if [ -d "functions" ]; then
        rsync -av functions/ dist/functions/
        echo "${GREEN}[Web] Pages Functions copied to dist${NC}"
    fi

    if [ "$DRY_RUN" = true ]; then
        echo "${YELLOW}[Web] Dry run — skipping deploy${NC}"
    else
        npx wrangler pages deploy dist --project-name=milnav --commit-dirty=true

        # Verify
        echo "${YELLOW}[Web] Verifying...${NC}"
        sleep 3
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://milnav.pages.dev" 2>/dev/null || echo "000")
        if [ "$STATUS" = "200" ]; then
            echo "${GREEN}[Web] ✓ https://milnav.pages.dev returned HTTP $STATUS${NC}"
        else
            echo "${RED}[Web] ✗ https://milnav.pages.dev returned HTTP $STATUS (may need a moment)${NC}"
        fi
    fi
    cd ..
fi

echo ""
echo "${GREEN}Deployment complete!${NC}"
