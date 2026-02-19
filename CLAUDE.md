# MilNav — Project Rules

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
- **Pattern:** All map components use DirectionsModal for navigation (Google Maps, Apple Maps, Waze)

## Key Patterns

- Always use DirectionsModal for "Get Directions" — never link directly to Google Maps
- Validate coordinates before rendering map markers (check for NaN, null, valid range)
- Frontend Tailwind v4: use `@import "tailwindcss"` + `@theme {}` in index.css
- Use `w-full max-w-7xl mx-auto` instead of `container mx-auto` (broken in Tailwind v4)
