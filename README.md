# MilNav — Military Installation Building Navigator

Find any building on a military installation by its building number. Get one-tap navigation to Google Maps, Apple Maps, or Waze.

## The Problem

Military installations use building numbers (e.g., "R2560", "32920") as their primary addressing system. These don't appear in consumer navigation apps, making it difficult for:

- **Service members & families** — Finding appointments, in-processing, daily navigation
- **Delivery drivers** — DoorDash, UberEats, Amazon finding delivery locations on post

## Features

- **Building Search** — Type a building number, get its location instantly
- **Interactive Map** — Browse all buildings on an installation with category filtering
- **One-Tap Navigation** — Open directions in Google Maps, Apple Maps, or Waze
- **Community Submissions** — Submit missing buildings (moderated before going live)
- **Multi-Installation** — Starting with Fort Bragg, NC with more coming

## Tech Stack

- **Backend:** Cloudflare Workers + [Hono](https://hono.dev)
- **Database:** Cloudflare D1 (SQLite at the edge)
- **Frontend:** React 19 + Vite + TypeScript
- **Maps:** [MapLibre GL](https://maplibre.org) + [OpenFreeMap](https://openfreemap.org) (free, no API keys)
- **Styling:** Tailwind CSS v4

## Development

### Prerequisites

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm i -g wrangler`)
- Cloudflare account

### Setup

```bash
# Clone
git clone https://github.com/gitayam/milnav.git
cd milnav

# Install backend dependencies
npm install

# Install frontend dependencies
cd web && npm install && cd ..

# Create D1 database
npx wrangler d1 create milnav-db
# Update wrangler.toml with the database_id

# Run migrations
npx wrangler d1 execute milnav-db --file=migrations/0001_initial_schema.sql
npx wrangler d1 execute milnav-db --file=migrations/0002_import_fort_bragg_buildings.sql

# Start dev server (backend)
npx wrangler dev

# Start dev server (frontend, separate terminal)
cd web && npm run dev
```

### Deployment

```bash
./deploy.sh          # Deploy both API and Web
./deploy.sh --api    # API Worker only
./deploy.sh --web    # Web frontend only
```

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/installations` | GET | List all installations |
| `/api/buildings?installation=fort-bragg` | GET | Buildings for an installation |
| `/api/buildings/search?q=32920&installation=fort-bragg` | GET | Search by building number |
| `/api/buildings/:id` | GET | Single building details |
| `/api/submissions` | POST | Submit a missing building |

## Supported Installations

### Fort Bragg, NC — 5,668 buildings

- **Source:** Cumberland County GIS REST Service ([BraggData/MapServer](https://gis.co.cumberland.nc.us/server/rest/services/Bragg/BraggData/MapServer))
- **Building formats:** Letter+digits (`R2560`, `A3137`) and digits-only (`32920`, `33121`)
- **Categories:** admin, barracks, dining, medical, housing, storage, maintenance, recreation, retail, and more
- **Data pipeline:** `scripts/generate-import-sql.py` transforms GIS JSON → D1 migration SQL

### Adding a New Installation

1. Find the county/regional GIS service with building footprint data
2. Download via REST API (see `scripts/generate-import-sql.py` for the pattern)
3. Generate migration SQL and run against D1
4. Add an installation seed row in the migration

## Contributing

Know a building number that's missing? Use the Submit page to add it — submissions are reviewed before going live.

## License

MIT
