#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "${BLUE}Community Packing List — Deployment${NC}"
echo "======================================"

echo ""
echo "${YELLOW}Building...${NC}"
pnpm build

echo ""
echo "${YELLOW}Deploying to Cloudflare Workers...${NC}"
npx wrangler deploy

echo ""
echo "${GREEN}Deployment complete!${NC}"

# Verify deployment
echo ""
echo "${YELLOW}Verifying...${NC}"
DEPLOY_URL="https://community-packing-list.wemea-5ahhf.workers.dev"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOY_URL")
if [ "$STATUS" = "200" ]; then
    echo "${GREEN}✓ $DEPLOY_URL returned HTTP $STATUS${NC}"
else
    echo "${RED}✗ $DEPLOY_URL returned HTTP $STATUS${NC}"
fi
