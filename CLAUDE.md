# Fort Maps — Project Rules

## Deployment

```bash
./deploy.sh          # Deploy both API and Web
./deploy.sh --api    # API Worker only
./deploy.sh --web    # Web frontend only
```

## Database

**D1 Database:** milnav-db

### Run Migrations
```bash
npx wrangler d1 execute milnav-db --remote --file=migrations/XXXX_migration.sql
```

### Query Database
```bash
npx wrangler d1 execute milnav-db --remote --command="SELECT * FROM buildings LIMIT 10;"
```

## Schema Convention

- Tables: lowercase (`buildings`, `installations`, `submissions`)
- Fields: snake_case (`building_number`, `installation_id`, `created_at`)

## Project Structure

```
milnav/
├── src/               # Backend (Cloudflare Worker + Hono)
│   ├── index.ts       # Main entry, routing
│   ├── routes/        # API route handlers
│   └── types.ts       # Shared types
├── web/               # Frontend (React + Vite + Tailwind v4)
│   ├── src/
│   │   ├── pages/     # Page components
│   │   ├── components/# Reusable components
│   │   └── lib/       # API client, types, helpers
│   └── functions/     # Cloudflare Pages Functions (API proxy)
├── migrations/        # D1 database migrations
└── deploy.sh
```

## Maps

- **Library:** MapLibre GL + react-map-gl
- **Tiles:** OpenFreeMap Liberty (free, no API keys)
- **Pattern:** All map components use DirectionsModal for navigation (Google Maps, Apple Maps, Waze, what3words)

## Coordinates

- **GPS:** Standard lat/lng stored in `latitude`/`longitude` columns
- **MGRS:** Military Grid Reference System stored in `mgrs` column (all 5,668 buildings populated)
- **MGRS Zone:** Fort Bragg falls in `17SPU` (UTM Zone 17, band S, 100km square PU)
- **what3words:** Lazy-cached via API in `w3w_address` column (requires `W3W_API_KEY` secret)
- **MGRS Package:** `mgrs` npm — CRITICAL: `forward([longitude, latitude], 5)` takes **lon/lat** order, NOT lat/lng
- **Search:** Users can search by building number, name, address, or MGRS coordinate

## Data Sources

### Fort Bragg Buildings (5,668 records)
- **Source:** Cumberland County GIS REST Service (`gis.co.cumberland.nc.us`)
- **Layer:** BraggData/MapServer Layer 2 (Buildings) + Layer 0 (Addresses)
- **Migration:** `migrations/0002_import_fort_bragg_buildings.sql`
- **Building number formats:** Letter+digits (`R2560`, `A3137`) and digits-only (`32920`, `33121`)
- **Zone prefixes:** A-Z correspond to installation zones visible on the map
- **Raw data:** `data/fort_bragg_buildings.json`, `data/fort_bragg_addresses.json`

### Adding New Installations
1. Find the county/regional GIS service with building data
2. Download via REST API (see `scripts/generate-import-sql.py` for pattern)
3. Generate migration SQL and run against D1
4. Add installation seed row in migration

## Key Patterns

- Always use DirectionsModal for "Get Directions" — never link directly to Google Maps
- Validate coordinates before rendering map markers (check for NaN, null, valid range)
- Frontend Tailwind v4: use `@import "tailwindcss"` + `@theme {}` in index.css
- Use `w-full max-w-7xl mx-auto` instead of `container mx-auto` (broken in Tailwind v4)
