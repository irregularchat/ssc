# MilNav Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a military building number → GPS coordinate lookup with interactive maps and navigation deep links, deployed on Cloudflare Workers.

**Architecture:** Hono API Worker with D1 database, React + Vite frontend with MapLibre GL maps, Cloudflare Pages deployment. Mirrors the Downtown-Guide project structure.

**Tech Stack:** Hono, Cloudflare D1, React 19, Vite 7, TypeScript, Tailwind CSS v4, MapLibre GL, OpenFreeMap tiles, react-map-gl, react-router-dom

---

### Task 1: Create GitHub Repo and Project Scaffold

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `package.json` (root — backend)
- Create: `wrangler.toml`
- Create: `tsconfig.json` (root — backend)
- Create: `src/index.ts`
- Create: `src/types.ts`

**Step 1: Create GitHub repo**

```bash
cd /Users/sac/Git/milnav
gh repo create milnav --public --description "Military installation building number navigator — find any building on post with one-tap navigation to Google Maps, Apple Maps, and Waze" --source=. --push
```

If repo already has commits, use `--source=.` with `--remote=origin`.

**Step 2: Write README.md**

```markdown
# MilNav — Military Installation Building Navigator

Find any building on a military installation by its building number. Get one-tap navigation to Google Maps, Apple Maps, or Waze.

## The Problem

Military installations use building numbers (e.g., "4-2274", "C-6837") as their primary addressing system. These don't appear in consumer navigation apps, making it difficult for:

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

\`\`\`bash
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

# Start dev server (backend)
npx wrangler dev

# Start dev server (frontend, separate terminal)
cd web && npm run dev
\`\`\`

### Deployment

\`\`\`bash
./deploy.sh          # Deploy both API and Web
./deploy.sh --api    # API Worker only
./deploy.sh --web    # Web frontend only
\`\`\`

## API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/installations` | GET | List all installations |
| `/api/buildings?installation=fort-bragg` | GET | Buildings for an installation |
| `/api/buildings/search?q=4-2274&installation=fort-bragg` | GET | Search by building number |
| `/api/buildings/:id` | GET | Single building details |
| `/api/submissions` | POST | Submit a missing building |

## Supported Installations

- Fort Bragg, NC (active)
- More coming soon

## Contributing

Know a building number that's missing? Use the Submit page to add it — submissions are reviewed before going live.

## License

MIT
```

**Step 3: Write .gitignore**

```
node_modules/
dist/
.wrangler/
.dev.vars
.env
*.log
.DS_Store
.vite/
```

**Step 4: Write root package.json**

```json
{
  "name": "milnav",
  "version": "1.0.0",
  "private": true,
  "description": "Military installation building number navigator",
  "main": "src/index.ts",
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:all": "./deploy.sh"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/gitayam/milnav.git"
  },
  "keywords": ["military", "navigation", "building-numbers", "cloudflare-workers"],
  "author": "",
  "license": "MIT",
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20251230.0",
    "typescript": "^5.9.3",
    "wrangler": "^4.54.0"
  },
  "dependencies": {
    "hono": "^4.11.3"
  }
}
```

**Step 5: Write wrangler.toml**

```toml
name = "milnav"
main = "src/index.ts"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "milnav-db"
database_id = "PLACEHOLDER_REPLACE_AFTER_CREATION"

[placement]
mode = "smart"

[observability]
enabled = true

[vars]
TIMEZONE = "America/New_York"
```

**Step 6: Write tsconfig.json (root — backend)**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "web"]
}
```

**Step 7: Write src/types.ts**

```typescript
export interface Bindings {
  DB: D1Database
  TIMEZONE: string
}

export interface Installation {
  id: string
  name: string
  slug: string
  state: string | null
  center_latitude: number
  center_longitude: number
  default_zoom: number
  created_at: string
}

export interface Building {
  id: string
  installation_id: string
  building_number: string
  name: string | null
  description: string | null
  latitude: number
  longitude: number
  address: string | null
  category: string | null
  floor_count: number | null
  verified: number
  source: string | null
  created_at: string
  updated_at: string
}

export interface Submission {
  id: string
  installation_id: string
  building_number: string
  name: string | null
  description: string | null
  latitude: number
  longitude: number
  category: string | null
  submitted_by: string | null
  status: 'pending' | 'approved' | 'rejected'
  reviewer_notes: string | null
  created_at: string
  reviewed_at: string | null
}

export const BUILDING_CATEGORIES = {
  admin: { label: 'Administrative', color: '#3B82F6' },
  medical: { label: 'Medical', color: '#EF4444' },
  dining: { label: 'Dining', color: '#22C55E' },
  barracks: { label: 'Barracks', color: '#6B7280' },
  housing: { label: 'Housing', color: '#8B5CF6' },
  training: { label: 'Training', color: '#F97316' },
  recreation: { label: 'Recreation', color: '#EC4899' },
  motor_pool: { label: 'Motor Pool', color: '#78716C' },
  supply: { label: 'Supply', color: '#EAB308' },
  other: { label: 'Other', color: '#94A3B8' },
} as const

export type BuildingCategory = keyof typeof BUILDING_CATEGORIES
```

**Step 8: Write src/index.ts (minimal Hono app)**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'milnav' }))

export default app
```

**Step 9: Install dependencies and verify**

```bash
cd /Users/sac/Git/milnav
npm install
npx tsc --noEmit
```

**Step 10: Commit**

```bash
git add README.md .gitignore package.json wrangler.toml tsconfig.json src/
git commit -m "feat: scaffold project with Hono backend, types, and README"
```

---

### Task 2: Create D1 Database and Initial Migration

**Files:**
- Create: `migrations/0001_initial_schema.sql`

**Step 1: Create D1 database**

```bash
npx wrangler d1 create milnav-db
```

Copy the `database_id` from the output.

**Step 2: Update wrangler.toml with real database_id**

Replace `PLACEHOLDER_REPLACE_AFTER_CREATION` with the actual ID.

**Step 3: Write migration**

```sql
-- MilNav Initial Schema
-- Tables: installations, buildings, submissions

CREATE TABLE IF NOT EXISTS installations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  state TEXT,
  center_latitude REAL NOT NULL,
  center_longitude REAL NOT NULL,
  default_zoom INTEGER DEFAULT 14,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buildings (
  id TEXT PRIMARY KEY,
  installation_id TEXT NOT NULL,
  building_number TEXT NOT NULL,
  name TEXT,
  description TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  address TEXT,
  category TEXT,
  floor_count INTEGER,
  verified INTEGER DEFAULT 0,
  source TEXT DEFAULT 'official',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (installation_id) REFERENCES installations(id),
  UNIQUE(installation_id, building_number)
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  installation_id TEXT NOT NULL,
  building_number TEXT NOT NULL,
  name TEXT,
  description TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  category TEXT,
  submitted_by TEXT,
  status TEXT DEFAULT 'pending',
  reviewer_notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buildings_installation ON buildings(installation_id);
CREATE INDEX IF NOT EXISTS idx_buildings_number ON buildings(installation_id, building_number);
CREATE INDEX IF NOT EXISTS idx_buildings_coords ON buildings(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_buildings_category ON buildings(category);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- Seed Fort Bragg installation
INSERT OR IGNORE INTO installations (id, name, slug, state, center_latitude, center_longitude, default_zoom)
VALUES ('fort-bragg', 'Fort Bragg', 'fort-bragg', 'NC', 35.1390, -79.0064, 13);
```

**Step 4: Run migration locally**

```bash
npx wrangler d1 execute milnav-db --file=migrations/0001_initial_schema.sql
```

**Step 5: Verify**

```bash
npx wrangler d1 execute milnav-db --command="SELECT * FROM installations;"
npx wrangler d1 execute milnav-db --command="SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;"
```

Expected: 3 tables (buildings, installations, submissions) and 1 row in installations.

**Step 6: Commit**

```bash
git add migrations/ wrangler.toml
git commit -m "feat: add D1 database schema with installations, buildings, submissions tables"
```

---

### Task 3: Backend API Routes — Installations & Buildings

**Files:**
- Create: `src/routes/installations.ts`
- Create: `src/routes/buildings.ts`
- Modify: `src/index.ts` — mount routes

**Step 1: Write src/routes/installations.ts**

```typescript
import { Hono } from 'hono'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

// GET /api/installations — List all
app.get('/', async (c) => {
  const results = await c.env.DB.prepare(
    'SELECT * FROM installations ORDER BY name'
  ).all()
  return c.json({ data: results.results })
})

// GET /api/installations/:slug — Single installation
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const result = await c.env.DB.prepare(
    'SELECT * FROM installations WHERE slug = ?'
  ).bind(slug).first()

  if (!result) return c.json({ error: 'Installation not found' }, 404)
  return c.json({ data: result })
})

export default app
```

**Step 2: Write src/routes/buildings.ts**

```typescript
import { Hono } from 'hono'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

// GET /api/buildings — List buildings for an installation
app.get('/', async (c) => {
  const installation = c.req.query('installation')
  if (!installation) {
    return c.json({ error: 'installation query parameter required' }, 400)
  }

  const category = c.req.query('category')
  const limit = Math.min(parseInt(c.req.query('limit') || '500'), 1000)
  const offset = parseInt(c.req.query('offset') || '0')

  let query = 'SELECT * FROM buildings WHERE installation_id = ?'
  const params: (string | number)[] = [installation]

  if (category && category !== 'all') {
    query += ' AND category = ?'
    params.push(category)
  }

  query += ' ORDER BY building_number ASC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const results = await c.env.DB.prepare(query).bind(...params).all()

  // Get total count
  let countQuery = 'SELECT COUNT(*) as total FROM buildings WHERE installation_id = ?'
  const countParams: (string | number)[] = [installation]
  if (category && category !== 'all') {
    countQuery += ' AND category = ?'
    countParams.push(category)
  }
  const countResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>()

  return c.json({
    data: results.results,
    count: results.results.length,
    total: countResult?.total || 0,
    pagination: { limit, offset, hasMore: offset + limit < (countResult?.total || 0) },
  })
})

// GET /api/buildings/search — Search by building number or name
app.get('/search', async (c) => {
  const q = c.req.query('q')
  const installation = c.req.query('installation')

  if (!q) return c.json({ error: 'q query parameter required' }, 400)
  if (!installation) return c.json({ error: 'installation query parameter required' }, 400)

  const searchTerm = `%${q}%`
  const results = await c.env.DB.prepare(`
    SELECT * FROM buildings
    WHERE installation_id = ?
      AND (building_number LIKE ? OR name LIKE ? OR description LIKE ? OR address LIKE ?)
    ORDER BY
      CASE WHEN building_number = ? THEN 0
           WHEN building_number LIKE ? THEN 1
           ELSE 2 END,
      building_number ASC
    LIMIT 20
  `).bind(installation, searchTerm, searchTerm, searchTerm, searchTerm, q, `${q}%`).all()

  return c.json({ data: results.results, count: results.results.length })
})

// GET /api/buildings/categories — Category counts for an installation
app.get('/categories', async (c) => {
  const installation = c.req.query('installation')
  if (!installation) {
    return c.json({ error: 'installation query parameter required' }, 400)
  }

  const results = await c.env.DB.prepare(`
    SELECT category, COUNT(*) as count
    FROM buildings
    WHERE installation_id = ?
    GROUP BY category
    ORDER BY count DESC
  `).bind(installation).all()

  return c.json({ data: results.results })
})

// GET /api/buildings/:id — Single building
app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const result = await c.env.DB.prepare(
    'SELECT * FROM buildings WHERE id = ?'
  ).bind(id).first()

  if (!result) return c.json({ error: 'Building not found' }, 404)
  return c.json({ data: result })
})

// GET /api/buildings/:id/directions — Navigation deep links
app.get('/:id/directions', async (c) => {
  const id = c.req.param('id')
  const building = await c.env.DB.prepare(
    'SELECT building_number, name, latitude, longitude FROM buildings WHERE id = ?'
  ).bind(id).first<{ building_number: string; name: string | null; latitude: number; longitude: number }>()

  if (!building) return c.json({ error: 'Building not found' }, 404)

  const { latitude, longitude } = building
  const label = building.name
    ? `Building ${building.building_number} - ${building.name}`
    : `Building ${building.building_number}`

  return c.json({
    data: {
      building_number: building.building_number,
      name: building.name,
      latitude,
      longitude,
      directions: {
        google: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`,
        apple: `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`,
        waze: `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`,
      }
    }
  })
})

export default app
```

**Step 3: Update src/index.ts to mount routes**

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Bindings } from './types'
import installationsRouter from './routes/installations'
import buildingsRouter from './routes/buildings'

const app = new Hono<{ Bindings: Bindings }>()

// CORS
app.use('/api/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}))

// Routes
app.route('/api/installations', installationsRouter)
app.route('/api/buildings', buildingsRouter)

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok', service: 'milnav' }))

export default app
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: add installations and buildings API routes with search"
```

---

### Task 4: Backend API Routes — Submissions (Crowdsource)

**Files:**
- Create: `src/routes/submissions.ts`
- Modify: `src/index.ts` — mount submissions route

**Step 1: Write src/routes/submissions.ts**

```typescript
import { Hono } from 'hono'
import type { Bindings } from '../types'

const app = new Hono<{ Bindings: Bindings }>()

// POST /api/submissions — Submit a new building
app.post('/', async (c) => {
  const body = await c.req.json()

  const { installation_id, building_number, latitude, longitude } = body
  if (!installation_id || !building_number || latitude == null || longitude == null) {
    return c.json({ error: 'installation_id, building_number, latitude, longitude are required' }, 400)
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return c.json({ error: 'Invalid coordinates' }, 400)
  }

  // Verify installation exists
  const installation = await c.env.DB.prepare(
    'SELECT id FROM installations WHERE id = ?'
  ).bind(installation_id).first()
  if (!installation) {
    return c.json({ error: 'Installation not found' }, 404)
  }

  const id = crypto.randomUUID()

  await c.env.DB.prepare(`
    INSERT INTO submissions (id, installation_id, building_number, name, description, latitude, longitude, category, submitted_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    id,
    installation_id,
    building_number,
    body.name || null,
    body.description || null,
    latitude,
    longitude,
    body.category || null,
    body.submitted_by || null,
  ).run()

  return c.json({ data: { id, status: 'pending' }, message: 'Submission received — it will be reviewed before going live.' }, 201)
})

// GET /api/submissions — List submissions (admin)
app.get('/', async (c) => {
  const status = c.req.query('status') || 'pending'
  const results = await c.env.DB.prepare(
    'SELECT * FROM submissions WHERE status = ? ORDER BY created_at DESC LIMIT 100'
  ).bind(status).all()
  return c.json({ data: results.results })
})

// PUT /api/submissions/:id — Approve or reject (admin)
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { status, reviewer_notes } = body

  if (!status || !['approved', 'rejected'].includes(status)) {
    return c.json({ error: 'status must be "approved" or "rejected"' }, 400)
  }

  const submission = await c.env.DB.prepare(
    'SELECT * FROM submissions WHERE id = ?'
  ).bind(id).first<{
    id: string; installation_id: string; building_number: string; name: string | null;
    description: string | null; latitude: number; longitude: number; category: string | null;
  }>()

  if (!submission) return c.json({ error: 'Submission not found' }, 404)

  // Update submission status
  await c.env.DB.prepare(`
    UPDATE submissions SET status = ?, reviewer_notes = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(status, reviewer_notes || null, id).run()

  // If approved, insert into buildings table
  if (status === 'approved') {
    const buildingId = crypto.randomUUID()
    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO buildings (id, installation_id, building_number, name, description, latitude, longitude, category, verified, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 'community')
    `).bind(
      buildingId,
      submission.installation_id,
      submission.building_number,
      submission.name,
      submission.description,
      submission.latitude,
      submission.longitude,
      submission.category,
    ).run()
  }

  return c.json({ data: { id, status }, message: `Submission ${status}` })
})

export default app
```

**Step 2: Mount in src/index.ts**

Add import and route:
```typescript
import submissionsRouter from './routes/submissions'
// ...
app.route('/api/submissions', submissionsRouter)
```

**Step 3: Verify**

```bash
npx tsc --noEmit
```

**Step 4: Commit**

```bash
git add src/
git commit -m "feat: add submissions API for moderated community building data"
```

---

### Task 5: Scaffold React Frontend

**Files:**
- Create: `web/package.json`
- Create: `web/tsconfig.json`
- Create: `web/tsconfig.app.json`
- Create: `web/tsconfig.node.json`
- Create: `web/vite.config.ts`
- Create: `web/postcss.config.js`
- Create: `web/index.html`
- Create: `web/src/main.tsx`
- Create: `web/src/App.tsx`
- Create: `web/src/index.css`
- Create: `web/src/vite-env.d.ts`
- Create: `web/public/_redirects`

**Step 1: Write web/package.json**

```json
{
  "name": "milnav-web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "maplibre-gl": "^5.15.0",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-map-gl": "^8.1.0",
    "react-router-dom": "^7.11.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "@types/react": "^19.2.5",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^5.1.1",
    "autoprefixer": "^10.4.23",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "typescript": "~5.9.3",
    "vite": "^7.2.4"
  }
}
```

**Step 2: Write web/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
    }
  }
})
```

**Step 3: Write web/postcss.config.js**

```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
```

**Step 4: Write web/tsconfig.json**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

**Step 5: Write web/tsconfig.app.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src"]
}
```

**Step 6: Write web/tsconfig.node.json**

```json
{
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2023"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Step 7: Write web/index.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Find any building on a military installation by its building number. One-tap navigation to Google Maps, Apple Maps, or Waze." />
    <title>MilNav — Military Building Navigator</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 8: Write web/src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

**Step 9: Write web/src/index.css**

```css
@import "tailwindcss";

@source "../src/**/*.{js,ts,jsx,tsx}";

@theme {
  --color-olive: #4B5320;
  --color-olive-50: #F5F6F0;
  --color-olive-100: #E8EAD8;
  --color-olive-200: #D1D5B1;
  --color-olive-300: #B3BA82;
  --color-olive-400: #8E9856;
  --color-olive-500: #4B5320;
  --color-olive-600: #3D4419;
  --color-olive-700: #2F3513;

  --color-sand: #C2B280;
  --color-sand-50: #FAF8F3;
  --color-sand-100: #F0EBD9;
  --color-sand-200: #E1D7B3;
  --color-sand-300: #C2B280;
  --color-sand-400: #A8975E;
  --color-sand-500: #8B7D47;

  --color-camo: #78866B;
  --color-steel: #43464B;
  --color-khaki: #BDB76B;
}
```

**Step 10: Write web/src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

**Step 11: Write web/src/App.tsx**

```tsx
import { Routes, Route } from 'react-router-dom'

function HomePage() {
  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-olive-700">MilNav</h1>
        <p className="mt-2 text-steel">Military Building Navigator</p>
        <p className="mt-4 text-sand-500">Coming soon — building search + interactive map</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
```

**Step 12: Write web/public/_redirects**

```
/*    /index.html   200
```

**Step 13: Install dependencies and verify build**

```bash
cd /Users/sac/Git/milnav/web && npm install && npm run build
```

**Step 14: Commit**

```bash
cd /Users/sac/Git/milnav
git add web/
git commit -m "feat: scaffold React frontend with Vite, Tailwind v4, MapLibre, react-router"
```

---

### Task 6: Frontend — Shared Types and API Client

**Files:**
- Create: `web/src/lib/types.ts`
- Create: `web/src/lib/api.ts`
- Create: `web/src/lib/directions.ts`

**Step 1: Write web/src/lib/types.ts**

```typescript
export interface Installation {
  id: string
  name: string
  slug: string
  state: string | null
  center_latitude: number
  center_longitude: number
  default_zoom: number
}

export interface Building {
  id: string
  installation_id: string
  building_number: string
  name: string | null
  description: string | null
  latitude: number
  longitude: number
  address: string | null
  category: string | null
  floor_count: number | null
  verified: number
  source: string | null
}

export const BUILDING_CATEGORIES: Record<string, { label: string; color: string }> = {
  admin: { label: 'Administrative', color: '#3B82F6' },
  medical: { label: 'Medical', color: '#EF4444' },
  dining: { label: 'Dining', color: '#22C55E' },
  barracks: { label: 'Barracks', color: '#6B7280' },
  housing: { label: 'Housing', color: '#8B5CF6' },
  training: { label: 'Training', color: '#F97316' },
  recreation: { label: 'Recreation', color: '#EC4899' },
  motor_pool: { label: 'Motor Pool', color: '#78716C' },
  supply: { label: 'Supply', color: '#EAB308' },
  other: { label: 'Other', color: '#94A3B8' },
}
```

**Step 2: Write web/src/lib/api.ts**

```typescript
import type { Installation, Building } from './types'

const BASE = '/api'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

export async function fetchInstallations(): Promise<Installation[]> {
  const res = await fetchJSON<{ data: Installation[] }>(`${BASE}/installations`)
  return res.data
}

export async function fetchBuildings(installation: string, category?: string): Promise<{ data: Building[]; total: number }> {
  const params = new URLSearchParams({ installation })
  if (category && category !== 'all') params.set('category', category)
  params.set('limit', '1000')
  const res = await fetchJSON<{ data: Building[]; total: number }>(`${BASE}/buildings?${params}`)
  return res
}

export async function searchBuildings(installation: string, query: string): Promise<Building[]> {
  const params = new URLSearchParams({ installation, q: query })
  const res = await fetchJSON<{ data: Building[] }>(`${BASE}/buildings/search?${params}`)
  return res.data
}

export async function fetchBuildingCategories(installation: string): Promise<{ category: string; count: number }[]> {
  const params = new URLSearchParams({ installation })
  const res = await fetchJSON<{ data: { category: string; count: number }[] }>(`${BASE}/buildings/categories?${params}`)
  return res.data
}

export async function submitBuilding(data: {
  installation_id: string
  building_number: string
  name?: string
  description?: string
  latitude: number
  longitude: number
  category?: string
  submitted_by?: string
}): Promise<{ id: string; status: string }> {
  const res = await fetch(`${BASE}/submissions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`Submit error: ${res.status}`)
  const json = await res.json()
  return json.data
}
```

**Step 3: Write web/src/lib/directions.ts**

```typescript
export type NavApp = 'google' | 'apple' | 'waze'

export function getDirectionsUrl(lat: number, lng: number, app: NavApp): string {
  switch (app) {
    case 'google':
      return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    case 'apple':
      return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
    case 'waze':
      return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`
  }
}

export function openDirections(lat: number, lng: number, app: NavApp): void {
  window.open(getDirectionsUrl(lat, lng, app), '_blank')
}
```

**Step 4: Verify build**

```bash
cd /Users/sac/Git/milnav/web && npm run build
```

**Step 5: Commit**

```bash
cd /Users/sac/Git/milnav
git add web/src/lib/
git commit -m "feat: add frontend types, API client, and navigation deep links"
```

---

### Task 7: Frontend — HomePage with Building Search

**Files:**
- Modify: `web/src/App.tsx` — add real HomePage and routing
- Create: `web/src/pages/HomePage.tsx`
- Create: `web/src/components/DirectionsModal.tsx`

**Step 1: Write web/src/components/DirectionsModal.tsx**

```tsx
import { type NavApp, getDirectionsUrl } from '../lib/directions'

interface DirectionsModalProps {
  isOpen: boolean
  onClose: () => void
  latitude: number
  longitude: number
  label: string
}

const NAV_APPS: { id: NavApp; name: string; icon: string }[] = [
  { id: 'google', name: 'Google Maps', icon: '📍' },
  { id: 'apple', name: 'Apple Maps', icon: '🗺' },
  { id: 'waze', name: 'Waze', icon: '🚗' },
]

export default function DirectionsModal({ isOpen, onClose, latitude, longitude, label }: DirectionsModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-steel mb-1">Get Directions</h3>
        <p className="text-sm text-gray-500 mb-4">{label}</p>
        <div className="space-y-2">
          {NAV_APPS.map((app) => (
            <a
              key={app.id}
              href={getDirectionsUrl(latitude, longitude, app.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 hover:bg-sand-50 transition-colors"
            >
              <span className="text-2xl">{app.icon}</span>
              <span className="font-medium text-steel">{app.name}</span>
            </a>
          ))}
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 text-gray-500 text-sm">
          Cancel
        </button>
      </div>
    </div>
  )
}
```

**Step 2: Write web/src/pages/HomePage.tsx**

```tsx
import { useState, useCallback } from 'react'
import { searchBuildings } from '../lib/api'
import { BUILDING_CATEGORIES } from '../lib/types'
import type { Building } from '../lib/types'
import DirectionsModal from '../components/DirectionsModal'

const DEFAULT_INSTALLATION = 'fort-bragg'

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [directionsBuilding, setDirectionsBuilding] = useState<Building | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const data = await searchBuildings(DEFAULT_INSTALLATION, query.trim())
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Hero */}
      <div className="bg-olive-700 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">MilNav</h1>
          <p className="mt-2 text-olive-200 text-lg">Find any building on post</p>

          {/* Search */}
          <div className="mt-8 flex gap-2 max-w-lg mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Building number (e.g., 4-2274)"
              className="flex-1 px-4 py-3 rounded-xl text-steel bg-white text-lg focus:outline-none focus:ring-2 focus:ring-sand-300"
            />
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-sand-300 text-olive-700 font-semibold rounded-xl hover:bg-sand-200 transition-colors disabled:opacity-50"
            >
              {loading ? '...' : 'Search'}
            </button>
          </div>

          <p className="mt-3 text-olive-300 text-sm">Fort Bragg, NC</p>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading && <p className="text-center text-gray-400">Searching...</p>}

        {searched && !loading && results.length === 0 && (
          <div className="text-center py-8">
            <p className="text-gray-500">No buildings found for "{query}"</p>
            <p className="text-sm text-gray-400 mt-1">Try a different building number or check the <a href="/explore" className="text-olive-500 underline">map</a></p>
          </div>
        )}

        {results.map((building) => {
          const cat = building.category ? BUILDING_CATEGORIES[building.category] : null
          return (
            <div key={building.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold text-steel">
                    Building {building.building_number}
                  </h2>
                  {building.name && (
                    <p className="text-olive-500 font-medium">{building.name}</p>
                  )}
                  {building.description && (
                    <p className="text-gray-500 text-sm mt-1">{building.description}</p>
                  )}
                  {building.address && (
                    <p className="text-gray-400 text-sm mt-1">{building.address}</p>
                  )}
                </div>
                {cat && (
                  <span
                    className="text-xs font-medium px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    {cat.label}
                  </span>
                )}
              </div>
              <button
                onClick={() => setDirectionsBuilding(building)}
                className="mt-4 w-full py-3 bg-olive-500 text-white font-semibold rounded-xl hover:bg-olive-600 transition-colors"
              >
                Get Directions
              </button>
            </div>
          )
        })}

        {/* Quick links */}
        {!searched && (
          <div className="text-center py-8">
            <a href="/explore" className="text-olive-500 underline text-lg">
              Browse all buildings on the map
            </a>
          </div>
        )}
      </div>

      {/* Directions Modal */}
      {directionsBuilding && (
        <DirectionsModal
          isOpen={!!directionsBuilding}
          onClose={() => setDirectionsBuilding(null)}
          latitude={directionsBuilding.latitude}
          longitude={directionsBuilding.longitude}
          label={`Building ${directionsBuilding.building_number}${directionsBuilding.name ? ` — ${directionsBuilding.name}` : ''}`}
        />
      )}
    </div>
  )
}
```

**Step 3: Update web/src/App.tsx**

```tsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
    </Routes>
  )
}
```

**Step 4: Verify build**

```bash
cd /Users/sac/Git/milnav/web && npm run build
```

**Step 5: Commit**

```bash
cd /Users/sac/Git/milnav
git add web/src/
git commit -m "feat: add HomePage with building search and DirectionsModal"
```

---

### Task 8: Frontend — ExplorePage with MapLibre Map

**Files:**
- Create: `web/src/pages/ExplorePage.tsx`
- Create: `web/src/components/BuildingMap.tsx`
- Modify: `web/src/App.tsx` — add explore route

**Step 1: Write web/src/components/BuildingMap.tsx**

```tsx
import { useRef, useCallback } from 'react'
import Map, { Marker, Popup, NavigationControl, GeolocateControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { Building, Installation } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'

interface BuildingMapProps {
  buildings: Building[]
  installation: Installation
  selectedBuilding: Building | null
  onSelectBuilding: (building: Building | null) => void
}

export default function BuildingMap({ buildings, installation, selectedBuilding, onSelectBuilding }: BuildingMapProps) {
  const mapRef = useRef<any>(null)

  const handleMarkerClick = useCallback((building: Building) => {
    onSelectBuilding(building)
    mapRef.current?.flyTo({
      center: [building.longitude, building.latitude],
      zoom: 17,
      duration: 500,
    })
  }, [onSelectBuilding])

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        latitude: installation.center_latitude,
        longitude: installation.center_longitude,
        zoom: installation.default_zoom,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="https://tiles.openfreemap.org/styles/liberty"
    >
      <NavigationControl position="top-right" />
      <GeolocateControl position="top-right" />

      {buildings.map((b) => {
        const cat = b.category ? BUILDING_CATEGORIES[b.category] : null
        const color = cat?.color || '#94A3B8'
        return (
          <Marker
            key={b.id}
            latitude={b.latitude}
            longitude={b.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              handleMarkerClick(b)
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-white cursor-pointer hover:scale-125 transition-transform"
              style={{ backgroundColor: color }}
              title={`Bldg ${b.building_number}`}
            />
          </Marker>
        )
      })}

      {selectedBuilding && (
        <Popup
          latitude={selectedBuilding.latitude}
          longitude={selectedBuilding.longitude}
          onClose={() => onSelectBuilding(null)}
          offset={12}
          closeOnClick={false}
        >
          <div className="p-1">
            <p className="font-bold text-sm">Bldg {selectedBuilding.building_number}</p>
            {selectedBuilding.name && <p className="text-xs text-gray-600">{selectedBuilding.name}</p>}
            {selectedBuilding.category && (
              <span className="text-xs text-gray-400">{BUILDING_CATEGORIES[selectedBuilding.category]?.label}</span>
            )}
          </div>
        </Popup>
      )}
    </Map>
  )
}
```

**Step 2: Write web/src/pages/ExplorePage.tsx**

```tsx
import { useState, useEffect, useMemo } from 'react'
import { fetchBuildings, fetchBuildingCategories } from '../lib/api'
import type { Building, Installation } from '../lib/types'
import { BUILDING_CATEGORIES } from '../lib/types'
import BuildingMap from '../components/BuildingMap'
import DirectionsModal from '../components/DirectionsModal'

const FORT_BRAGG: Installation = {
  id: 'fort-bragg',
  name: 'Fort Bragg',
  slug: 'fort-bragg',
  state: 'NC',
  center_latitude: 35.1390,
  center_longitude: -79.0064,
  default_zoom: 13,
}

export default function ExplorePage() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [directionsBuilding, setDirectionsBuilding] = useState<Building | null>(null)
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map')

  useEffect(() => {
    fetchBuildings('fort-bragg').then((res) => setBuildings(res.data))
    fetchBuildingCategories('fort-bragg').then(setCategories)
  }, [])

  const filteredBuildings = useMemo(() => {
    let result = buildings
    if (selectedCategory !== 'all') {
      result = result.filter((b) => b.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((b) =>
        b.building_number.toLowerCase().includes(q) ||
        b.name?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
      )
    }
    return result
  }, [buildings, selectedCategory, searchQuery])

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-olive-700 text-white px-4 py-3 flex items-center gap-4">
        <a href="/" className="font-bold text-lg">MilNav</a>
        <span className="text-olive-300 text-sm">Fort Bragg</span>
        <div className="flex-1" />
        {/* Mobile view toggle */}
        <div className="md:hidden flex gap-1">
          <button
            onClick={() => setMobileView('map')}
            className={`px-3 py-1 rounded-lg text-sm ${mobileView === 'map' ? 'bg-white/20' : ''}`}
          >
            Map
          </button>
          <button
            onClick={() => setMobileView('list')}
            className={`px-3 py-1 rounded-lg text-sm ${mobileView === 'list' ? 'bg-white/20' : ''}`}
          >
            List
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white border-b px-4 py-2 flex gap-2 items-center overflow-x-auto">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search buildings..."
          className="px-3 py-1.5 border rounded-lg text-sm min-w-[180px] focus:outline-none focus:ring-1 focus:ring-olive-300"
        />
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            selectedCategory === 'all' ? 'bg-olive-500 text-white' : 'bg-gray-100 text-gray-600'
          }`}
        >
          All ({buildings.length})
        </button>
        {categories.map((cat) => {
          const info = BUILDING_CATEGORIES[cat.category]
          return (
            <button
              key={cat.category}
              onClick={() => setSelectedCategory(cat.category)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                selectedCategory === cat.category ? 'text-white' : 'bg-gray-100 text-gray-600'
              }`}
              style={selectedCategory === cat.category ? { backgroundColor: info?.color || '#94A3B8' } : {}}
            >
              {info?.label || cat.category} ({cat.count})
            </button>
          )
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Map */}
        <div className={`flex-1 ${mobileView === 'list' ? 'hidden md:block' : ''}`}>
          <BuildingMap
            buildings={filteredBuildings}
            installation={FORT_BRAGG}
            selectedBuilding={selectedBuilding}
            onSelectBuilding={setSelectedBuilding}
          />
        </div>

        {/* Sidebar / List */}
        <div className={`w-full md:w-80 lg:w-96 overflow-y-auto border-l bg-white ${mobileView === 'map' ? 'hidden md:block' : ''}`}>
          <div className="p-3 text-sm text-gray-500">
            {filteredBuildings.length} buildings
          </div>
          {filteredBuildings.map((b) => {
            const cat = b.category ? BUILDING_CATEGORIES[b.category] : null
            return (
              <div
                key={b.id}
                onClick={() => setSelectedBuilding(b)}
                className={`px-4 py-3 border-b cursor-pointer hover:bg-sand-50 transition-colors ${
                  selectedBuilding?.id === b.id ? 'bg-sand-100' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  {cat && (
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  )}
                  <span className="font-semibold text-sm text-steel">Bldg {b.building_number}</span>
                </div>
                {b.name && <p className="text-sm text-gray-600 mt-0.5">{b.name}</p>}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setDirectionsBuilding(b) }}
                    className="text-xs text-olive-500 font-medium hover:underline"
                  >
                    Directions
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Directions Modal */}
      {directionsBuilding && (
        <DirectionsModal
          isOpen={!!directionsBuilding}
          onClose={() => setDirectionsBuilding(null)}
          latitude={directionsBuilding.latitude}
          longitude={directionsBuilding.longitude}
          label={`Building ${directionsBuilding.building_number}${directionsBuilding.name ? ` — ${directionsBuilding.name}` : ''}`}
        />
      )}
    </div>
  )
}
```

**Step 3: Update web/src/App.tsx**

```tsx
import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ExplorePage from './pages/ExplorePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/explore" element={<ExplorePage />} />
    </Routes>
  )
}
```

**Step 4: Verify build**

```bash
cd /Users/sac/Git/milnav/web && npm run build
```

**Step 5: Commit**

```bash
cd /Users/sac/Git/milnav
git add web/src/
git commit -m "feat: add ExplorePage with interactive MapLibre map and building list"
```

---

### Task 9: Cloudflare Pages Functions Proxy + Deploy Script

**Files:**
- Create: `web/functions/api/[[path]].ts`
- Create: `web/public/_routes.json`
- Create: `deploy.sh`
- Create: `CLAUDE.md`

**Step 1: Write web/functions/api/[[path]].ts**

```typescript
/**
 * API Proxy — forwards /api/* requests to the MilNav Worker backend.
 */

const WORKER_URL = 'https://milnav.ACCOUNT_SUBDOMAIN.workers.dev'

async function handleRequest(context: EventContext<unknown, string, unknown>): Promise<Response> {
  const { request, params, next } = context

  const pathSegments = params.path as string[]
  const path = pathSegments ? pathSegments.join('/') : ''
  if (!path) return next()

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  const url = new URL(request.url)
  const workerUrl = `${WORKER_URL}/api/${path}${url.search}`

  const headers = new Headers()
  for (const name of ['content-type', 'accept', 'user-agent']) {
    const val = request.headers.get(name)
    if (val) headers.set(name, val)
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: 'manual',
  }

  if (!['GET', 'HEAD'].includes(request.method)) {
    init.body = request.body
    ;(init as any).duplex = 'half'
  }

  const response = await fetch(workerUrl, init)
  const responseHeaders = new Headers(response.headers)
  if (!responseHeaders.has('Access-Control-Allow-Origin')) {
    responseHeaders.set('Access-Control-Allow-Origin', '*')
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

export const onRequest: PagesFunction = handleRequest
```

> **Note:** The WORKER_URL will be updated after the first `wrangler deploy` reveals the actual subdomain.

**Step 2: Write web/public/_routes.json**

```json
{
  "version": 1,
  "include": ["/api/*"],
  "exclude": []
}
```

**Step 3: Write deploy.sh**

```bash
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
```

**Step 4: Make deploy.sh executable**

```bash
chmod +x /Users/sac/Git/milnav/deploy.sh
```

**Step 5: Write CLAUDE.md**

```markdown
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
```

**Step 6: Commit**

```bash
cd /Users/sac/Git/milnav
git add web/functions/ web/public/_routes.json deploy.sh CLAUDE.md
git commit -m "feat: add Pages Functions proxy, deploy script, and project rules"
```

---

### Task 10: Create GitHub Repo and Push

**Step 1: Create GitHub repo and push**

```bash
cd /Users/sac/Git/milnav
gh repo create milnav --public --description "Military installation building number navigator — find any building on post with one-tap navigation to Google Maps, Apple Maps, and Waze" --source=. --remote=origin --push
```

If origin already exists:
```bash
git remote set-url origin https://github.com/gitayam/milnav.git
git push -u origin main
```

**Step 2: Verify on GitHub**

```bash
gh repo view milnav --web
```

---

### Task 11: Create D1 Database on Cloudflare and Run Remote Migration

**Step 1: Create the D1 database**

```bash
npx wrangler d1 create milnav-db
```

**Step 2: Update wrangler.toml with real database_id**

Copy the `database_id` from the output and replace `PLACEHOLDER_REPLACE_AFTER_CREATION`.

**Step 3: Run migration on remote**

```bash
npx wrangler d1 execute milnav-db --remote --file=migrations/0001_initial_schema.sql
```

**Step 4: Verify**

```bash
npx wrangler d1 execute milnav-db --remote --command="SELECT * FROM installations;"
```

**Step 5: Deploy API Worker**

```bash
npx wrangler deploy
```

Note the worker URL from the output (e.g., `https://milnav.XXXXX.workers.dev`).

**Step 6: Update the Pages Functions proxy**

Update `web/functions/api/[[path]].ts` with the actual worker URL.

**Step 7: Verify API**

```bash
curl https://milnav.XXXXX.workers.dev/api/health
curl https://milnav.XXXXX.workers.dev/api/installations
```

**Step 8: Commit and push**

```bash
cd /Users/sac/Git/milnav
git add wrangler.toml web/functions/api/
git commit -m "chore: configure D1 database ID and worker URL"
git push
```

---

## Summary

| Task | What It Does |
|------|-------------|
| 1 | GitHub repo + scaffold (README, package.json, wrangler.toml, Hono entry) |
| 2 | D1 migration (installations, buildings, submissions + Fort Bragg seed) |
| 3 | API: installations + buildings routes (list, search, categories, directions) |
| 4 | API: submissions routes (create, list, approve/reject with auto-insert) |
| 5 | React frontend scaffold (Vite, Tailwind v4, react-router, MapLibre) |
| 6 | Frontend shared types, API client, directions helper |
| 7 | HomePage with building number search + DirectionsModal |
| 8 | ExplorePage with MapLibre map + building list + category filters |
| 9 | Pages Functions API proxy + deploy.sh + CLAUDE.md |
| 10 | Create GitHub repo and push |
| 11 | Create D1 on Cloudflare, run migration, deploy, verify |
