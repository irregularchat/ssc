# SSC Monorepo — Project Rules

## Structure

```
ssc/
├── apps/
│   ├── milnav/          # Military building navigator (Hono Worker + React Pages)
│   └── packing-list/    # Community packing lists (React Router 7 + Workers)
├── packages/
│   ├── ui/              # @ssc/ui — shared React components
│   ├── config/          # @ssc/config — shared TS/ESLint config
│   └── cloudflare-utils/# @ssc/cloudflare-utils — D1 helpers, CORS
```

## Commands

```bash
pnpm dev                          # All apps dev servers
pnpm dev --filter=milnav          # milnav only
pnpm dev --filter=@cpl/web        # packing-list only
pnpm build                        # Build all (cached)
pnpm deploy:milnav                # Deploy milnav (API + Web)
pnpm deploy:packing-list          # Deploy packing-list (build + migrate + deploy)
pnpm deploy:all                   # Deploy everything
./deploy.sh milnav --api          # Deploy milnav API Worker only
./deploy.sh milnav --web          # Deploy milnav Web frontend only
./deploy.sh packing-list --dry-run  # Build and verify without deploying
./deploy.sh packing-list --migrate-only  # Run D1 migrations only
```

## Conventions

- **Tables:** lowercase + snake_case (PascalCase causes silent FK failures in D1)
- **Timezone:** Always `America/New_York` explicit. In Workers: `getUTCDay()`, `Date.UTC()`, never `new Date("YYYY-MM-DD")`
- **Deploy → verify:** Always curl/check after deployment
- **Packages:** Internal only (`workspace:*`), never published to npm

## Apps

### milnav
- **API:** Cloudflare Worker with Hono (`apps/milnav/api/`)
- **Web:** React 19 + Vite + Tailwind v4 on Cloudflare Pages (`apps/milnav/web/`)
- **Database:** D1 `milnav-db`
- **Deploy:** `cd apps/milnav && ./deploy.sh`

### packing-list
- **App:** React Router 7 SSR on Cloudflare Workers (`apps/packing-list/`)
- **Database:** D1 `cpl-db`
- **Storage:** R2 `cpl-uploads`
- **Deploy:** `cd apps/packing-list && ./deploy.sh`

## Database

### milnav D1 Migrations
```bash
npx wrangler d1 execute milnav-db --remote --file=apps/milnav/migrations/XXXX.sql
```

### packing-list D1 Migrations
```bash
cd apps/packing-list && npx wrangler d1 migrations apply cpl-db --remote
```
