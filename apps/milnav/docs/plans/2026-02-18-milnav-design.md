# MilNav — Military Installation Building Navigator

**Date:** 2026-02-18
**Status:** Approved

## Problem

Military installations use building numbers (e.g., "4-2274", "C-6837") as their primary addressing system. These building numbers don't appear in Google Maps, Apple Maps, or other consumer navigation apps. This creates real problems for:

- **Service members & families** — New arrivals learning to navigate post, finding appointments, in-processing locations
- **Delivery drivers** — DoorDash, UberEats, Amazon drivers who need to find delivery locations on post

## Solution

A web application that maps military building numbers to GPS coordinates and provides one-tap navigation to Google Maps, Apple Maps, and Waze. Includes an interactive map for browsing all buildings on an installation, and community-moderated submissions for adding/correcting data.

## Target

- **Initial installation:** Fort Bragg, NC (renamed back from Fort Liberty in 2025)
- **Data source:** Official DoD/installation data
- **Future:** Multi-installation support

## Architecture

### Stack

| Layer | Technology |
|-------|-----------|
| Backend | Cloudflare Workers + Hono |
| Database | Cloudflare D1 (SQLite) |
| Frontend | React 19 + Vite + TypeScript |
| Maps | MapLibre GL + OpenFreeMap tiles |
| Styling | Tailwind CSS v4 |
| Deployment | Cloudflare Pages + Workers |

### Project Structure

```
milnav/
├── src/                          # Backend (Hono Worker)
│   ├── index.ts                  # App entry + routing
│   ├── routes/
│   │   ├── buildings.ts          # Building search and lookup
│   │   ├── installations.ts      # Installation listing
│   │   └── submissions.ts        # Crowdsource moderation
│   └── types.ts
├── web/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.tsx      # Search box + quick lookup
│   │   │   ├── ExplorePage.tsx   # Map view with all buildings
│   │   │   └── SubmitPage.tsx    # Crowdsource submission form
│   │   ├── components/
│   │   │   ├── BuildingMap.tsx   # MapLibre map with building markers
│   │   │   ├── SearchBar.tsx     # Building number search
│   │   │   └── DirectionsModal.tsx
│   │   └── lib/
│   │       ├── api.ts
│   │       └── types.ts
│   └── public/
├── functions/                    # Cloudflare Pages Functions
│   └── api/[[path]].ts
├── migrations/                   # D1 migrations
├── wrangler.toml
├── deploy.sh
└── CLAUDE.md
```

## Database Schema

### installations

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | e.g., "fort-bragg" |
| name | TEXT NOT NULL | e.g., "Fort Bragg" |
| slug | TEXT UNIQUE | URL-friendly |
| state | TEXT | e.g., "NC" |
| center_latitude | REAL NOT NULL | Map center |
| center_longitude | REAL NOT NULL | Map center |
| default_zoom | INTEGER | Default 14 |
| created_at | TIMESTAMP | |

### buildings

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| installation_id | TEXT FK | References installations |
| building_number | TEXT NOT NULL | e.g., "4-2274" |
| name | TEXT | Common name (e.g., "DFAC") |
| description | TEXT | Purpose/contents |
| latitude | REAL NOT NULL | |
| longitude | REAL NOT NULL | |
| address | TEXT | Street if available |
| category | TEXT | barracks, admin, medical, dining, etc. |
| floor_count | INTEGER | |
| verified | INTEGER | 0=unverified, 1=verified |
| source | TEXT | "official", "community", "import" |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**Constraint:** UNIQUE(installation_id, building_number)

### submissions (moderation queue)

| Column | Type | Notes |
|--------|------|-------|
| id | TEXT PK | |
| installation_id | TEXT NOT NULL | |
| building_number | TEXT NOT NULL | |
| name | TEXT | |
| description | TEXT | |
| latitude | REAL NOT NULL | |
| longitude | REAL NOT NULL | |
| category | TEXT | |
| submitted_by | TEXT | Optional identifier |
| status | TEXT | pending/approved/rejected |
| reviewer_notes | TEXT | |
| created_at | TIMESTAMP | |
| reviewed_at | TIMESTAMP | |

## API Endpoints

```
GET  /api/installations                              — List all installations
GET  /api/installations/:slug                        — Single installation
GET  /api/buildings?installation=fort-bragg           — All buildings for installation
GET  /api/buildings/search?q=4-2274&installation=fort-bragg — Search
GET  /api/buildings/:id                              — Single building
GET  /api/buildings/:id/directions                   — Navigation deep links
POST /api/submissions                                — Submit building (moderation)
GET  /api/submissions?status=pending                 — Admin: pending list
PUT  /api/submissions/:id                            — Admin: approve/reject
```

## Frontend Pages

### Home Page — Quick Lookup
- Large search bar: "Enter building number (e.g., 4-2274)"
- Installation selector dropdown (defaults to Fort Bragg)
- Result shows: building number, name, category, mini-map
- One-tap: Google Maps / Apple Maps / Waze buttons

### Explore Page — Interactive Map
- MapLibre map with all buildings as category-colored markers
- Click marker → popup with details + directions
- Search/filter sidebar by number, name, or category
- Geolocation "center on me"

### Submit Page — Crowdsource
- Form: building number, name, description, category
- Map pin drop for coordinates
- Goes to moderation queue

## Navigation Deep Links

```typescript
function getDirectionsUrl(lat: number, lng: number, app: 'google' | 'apple' | 'waze'): string {
  switch (app) {
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    case 'apple':
      return `https://maps.apple.com/?daddr=${lat},${lng}`
    case 'waze':
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }
}
```

## Building Categories

| Category | Color | Description |
|----------|-------|-------------|
| admin | #3B82F6 (Blue) | HQ, offices, admin buildings |
| medical | #EF4444 (Red) | TMC, hospital, dental |
| dining | #22C55E (Green) | DFAC, food courts |
| barracks | #6B7280 (Gray) | Enlisted barracks |
| housing | #8B5CF6 (Purple) | Family housing |
| training | #F97316 (Orange) | Ranges, classrooms |
| recreation | #EC4899 (Pink) | Gym, MWR, PX/BX |
| motor_pool | #78716C (Stone) | Vehicle maintenance |
| supply | #EAB308 (Yellow) | CIF, supply warehouses |
| other | #94A3B8 (Slate) | Everything else |

## Decisions

- **MapLibre over Google Maps** — Free, no API keys, proven in Downtown-Guide
- **D1 over KV** — Relational data with search needs SQL, not key-value
- **Moderated submissions** — Community data must be verified before going live
- **Building number as primary search** — This is the core use case, not address
