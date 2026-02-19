#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DEPLOY_API=false
DEPLOY_WEB=false

if [ $# -eq 0 ]; then
    DEPLOY_API=true
    DEPLOY_WEB=true
fi

for arg in "$@"; do
    case $arg in
        --api) DEPLOY_API=true ;;
        --web) DEPLOY_WEB=true ;;
        --all) DEPLOY_API=true; DEPLOY_WEB=true ;;
        --help|-h)
            echo "MilNav Deployment Script"
            echo ""
            echo "Usage:"
            echo "  ./deploy.sh          Deploy both API and Web (default)"
            echo "  ./deploy.sh --api    Deploy only the API Worker"
            echo "  ./deploy.sh --web    Deploy only the Web Frontend"
            echo ""
            exit 0
            ;;
        *) echo "${RED}Unknown option: $arg${NC}"; exit 1 ;;
    esac
done

echo ""
echo "${BLUE}MilNav — Deployment${NC}"
echo "========================="

# Deploy API Worker
if [ "$DEPLOY_API" = true ]; then
    echo ""
    echo "${YELLOW}Deploying API Worker...${NC}"
    npx wrangler deploy
    echo "${GREEN}API Worker deployed${NC}"
fi

# Deploy Web Frontend
if [ "$DEPLOY_WEB" = true ]; then
    echo ""
    echo "${YELLOW}Deploying Web Frontend...${NC}"
    cd web
    [ ! -d "node_modules" ] && npm install
    npm run build

    # Verify build
    if grep -q 'src="/src/main.tsx"' dist/index.html 2>/dev/null; then
        echo "${RED}ERROR: dist/index.html has development script!${NC}"
        cd ..
        exit 1
    fi
    echo "${GREEN}Build verified${NC}"

    npx wrangler pages deploy dist --project-name=milnav --commit-dirty=true
    cd ..
    echo "${GREEN}Web Frontend deployed${NC}"
fi

echo ""
echo "${GREEN}Deployment complete!${NC}"
