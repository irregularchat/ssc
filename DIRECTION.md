# Direction: SSC monorepo

A pnpm monorepo of small Cloudflare apps for the military community: MilNav ("Fort Maps",
building-number search and navigation on post), Community Packing List, and Speech
Memorization.

Status: dormant (last change 2026-04-22). The project ran in bursts: packing list in
Oct 2025, MilNav in Feb 2026, then one day consolidating everything into the monorepo.

## Where it is heading
- Consolidate standalone repos into one workspace with shared packages: `@ssc/ui`,
  `@ssc/config` and `@ssc/cloudflare-utils` (7ab7c2e, 346fce8, 3ef9e26, 1fd0b5d, CLAUDE.md).
- Everything runs on Cloudflare: Workers/Pages, D1 and R2. The Django and Vite-SPA versions of
  the packing list were replaced by React Router 7 SSR on Workers (5e07880, 4eb37b1).
- Each app gets an audit, and its findings are then fixed (apps/packing-list/AUDIT.md,
  apps/speech-memorization/AUDIT.md, e20085c, 3a20dc2).
- MilNav: mobile-first navigation with MGRS and Plus Codes, plus a delivery-driver multi-stop
  mode (fb80559, 6e2012e, 2c42040, apps/milnav/docs/plans/).

## Priorities
1. Security and data hygiene review (tracked privately).
2. Speech Memorization phase 2: the phase-1 spec defers "enhanced features"
   (docs/superpowers/specs/2026-04-22-speech-memorization-design.md).
3. MilNav: add more installations beyond Fort Bragg (apps/milnav/README.md "Multi-Installation").

## Non-goals and constraints
- D1 tables are lowercase snake_case. Times are `America/New_York`, computed with UTC methods
  in Workers. Verify every deploy with curl. Internal packages use `workspace:*` and are never
  published (CLAUDE.md "Conventions").
- Deploy per app with its `deploy.sh`. Packing-list migrations go through `wrangler d1
  migrations apply` (CLAUDE.md).
- Speech Memorization has no backend, auth or database by design; it uses localStorage only
  (speech-memorization spec, "Decisions").
- MilNav uses free, keyless location codes: Plus Codes replaced what3words (6e2012e).
- Community-submitted buildings are moderated before they go live (apps/milnav/README.md).

## Decisions
- 2026-04-22: Formed the SSC monorepo and imported milnav and community-packing-list with
  history (7ab7c2e, 346fce8, 3ef9e26).
- 2026-04-22: Packing-list prices are stored in cents; admin auth uses HMAC-signed cookies
  (cd93a17, 80fe880).
- 2026-04-22: Speech Memorization phase 1 is a static SPA (spec, 7860a49).
- 2026-02-19: Rebranded MilNav to Fort Maps and added MGRS search (4f1c1bf).
- 2026-02-19: Plus Codes replaced what3words (6e2012e).
- 2025-10-03: Packing list migrated from Django templates to React on Cloudflare (cdc084e, 41b6b11).

## Open questions for the owner
1. Is this monorepo still the home for these apps, or will they move into another monorepo
   the way uas-portal did?
2. Which app, if any, should get work next?

## Related documents
- CLAUDE.md, apps/milnav/README.md, apps/milnav/docs/plans/
- apps/packing-list/AUDIT.md, apps/packing-list/docs/DATABASE_OPERATIONS.md
- apps/speech-memorization/AUDIT.md, docs/superpowers/specs/2026-04-22-speech-memorization-design.md
- To resume: pick an app, re-run its audit against the current code, and update the AUDIT.md
  status.
