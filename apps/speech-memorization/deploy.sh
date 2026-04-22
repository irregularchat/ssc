#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

DRY_RUN=false
for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
  esac
done

echo "${YELLOW}Building speech-memorization...${NC}"
pnpm build

if [ "$DRY_RUN" = true ]; then
  echo "${YELLOW}[DRY RUN] Would deploy to Cloudflare Pages${NC}"
  echo "${GREEN}Build output:${NC}"
  ls -la build/client/
  exit 0
fi

echo "${YELLOW}Deploying to Cloudflare Pages...${NC}"
npx wrangler pages deploy build/client --project-name=speech-memorization --commit-dirty=true

echo "${GREEN}Deploy complete!${NC}"
