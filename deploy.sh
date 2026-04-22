#!/bin/bash
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Ensure we're in the monorepo root
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

print_usage() {
    echo "SSC Monorepo Deployment"
    echo ""
    echo "Usage:"
    echo "  ./deploy.sh milnav              Deploy milnav (API + Web)"
    echo "  ./deploy.sh milnav --api        Deploy milnav API Worker only"
    echo "  ./deploy.sh milnav --web        Deploy milnav Web frontend only"
    echo "  ./deploy.sh packing-list        Deploy packing-list (build + migrate + deploy)"
    echo "  ./deploy.sh packing-list --skip-migrate"
    echo "  ./deploy.sh all                 Deploy everything"
    echo "  ./deploy.sh all --dry-run       Dry run everything"
    echo ""
    echo "Flags (passed through to app deploy scripts):"
    echo "  --dry-run        Build and verify but don't deploy"
    echo "  --skip-migrate   Skip D1 migrations (packing-list)"
    echo "  --migrate-only   Run D1 migrations only (packing-list)"
    echo ""
}

if [ $# -eq 0 ]; then
    print_usage
    exit 0
fi

APP="$1"
shift

case "$APP" in
    milnav)
        echo "${BLUE}═══════════════════════════════════${NC}"
        echo "${BLUE}  Deploying: MilNav${NC}"
        echo "${BLUE}═══════════════════════════════════${NC}"
        cd apps/milnav
        ./deploy.sh "$@"
        ;;
    speech-memorization|speech)
        echo "${BLUE}═══════════════════════════════════${NC}"
        echo "${BLUE}  Deploying: Speech Memorization${NC}"
        echo "${BLUE}═══════════════════════════════════${NC}"
        cd apps/speech-memorization
        ./deploy.sh "$@"
        ;;
    packing-list|cpl)
        echo "${BLUE}═══════════════════════════════════${NC}"
        echo "${BLUE}  Deploying: Community Packing List${NC}"
        echo "${BLUE}═══════════════════════════════════${NC}"
        cd apps/packing-list
        ./deploy.sh "$@"
        ;;
    all)
        echo "${BLUE}═══════════════════════════════════${NC}"
        echo "${BLUE}  Deploying: All Apps${NC}"
        echo "${BLUE}═══════════════════════════════════${NC}"
        echo ""

        echo "${BLUE}── MilNav ──────────────────────────${NC}"
        cd apps/milnav
        ./deploy.sh "$@"
        cd "$SCRIPT_DIR"

        echo ""
        echo "${BLUE}── Speech Memorization ─────────────${NC}"
        cd apps/speech-memorization
        ./deploy.sh "$@"
        cd "$SCRIPT_DIR"

        echo ""
        echo "${BLUE}── Community Packing List ──────────${NC}"
        cd apps/packing-list
        ./deploy.sh "$@"
        cd "$SCRIPT_DIR"

        echo ""
        echo "${GREEN}═══════════════════════════════════${NC}"
        echo "${GREEN}  All deployments complete${NC}"
        echo "${GREEN}═══════════════════════════════════${NC}"
        ;;
    --help|-h)
        print_usage
        ;;
    *)
        echo "${RED}Unknown app: $APP${NC}"
        echo ""
        print_usage
        exit 1
        ;;
esac
