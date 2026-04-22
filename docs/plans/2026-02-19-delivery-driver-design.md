# Delivery Driver Feature — Design

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `/deliver` page that lets delivery drivers plan optimized multi-stop routes across Fort Bragg, with gate access info and navigation export.

**Architecture:** Frontend-only feature. No backend changes needed — the existing buildings search API provides all data. Route optimization runs client-side using nearest-neighbor on haversine distances. Route state persists in localStorage.

**Tech Stack:** React 19, MapLibre GL, Tailwind v4, react-router-dom v7

---

## User Flow

### Step 1 — Starting Point
- Default: "Use my current location" (browser geolocation)
- Toggle option: "Start at All American Gate (Bldg H1575)"
- Tooltip on gate option: "Most visitors enter via the All American Gate on Reilly Rd. Anyone with a REAL ID can enter Fort Bragg at normal FPCON levels. Commercial vehicles may be subject to inspection at Bldg H1575."

### Step 2 — Add Delivery Stops
- Search box reusing existing search API (building number, name, MGRS, Plus Code)
- Each search result shows a quick "+ Add" button
- Selected stops appear in an ordered list below the search
- Tap to remove, drag handle to reorder manually

### Step 3 — Optimize & Navigate
- "Optimize Route" button reorders stops via nearest-neighbor TSP
- Shows stop count and rough time estimate (~3 min between stops on post)
- "Start Navigation" opens external nav app with multi-stop directions
- Google Maps URL supports up to 10 waypoints; for >10 stops, split into legs

## Components

### New Files
- `web/src/pages/DeliverPage.tsx` — Main delivery planning page
- `web/src/components/DeliveryStopList.tsx` — Ordered stop list with remove/reorder
- `web/src/components/GateInfoBanner.tsx` — Gate access info with tooltip
- `web/src/lib/route-utils.ts` — Haversine distance, nearest-neighbor optimizer, multi-stop URL builder

### Modified Files
- `web/src/App.tsx` — Add `/deliver` route

### Reused Patterns
- Search API from `web/src/lib/api.ts` (searchBuildings)
- BuildingMap component for route visualization
- DirectionsModal patterns for copy-to-clipboard, nav app links
- Tailwind color scheme (olive-700 header, sand-50 background)

## Route Optimization

Client-side nearest-neighbor algorithm:
1. Start at origin (gate coordinates or geolocation)
2. Find nearest unvisited building by haversine distance
3. Visit it, repeat until all buildings visited
4. Return ordered list of stops

This runs in <1ms for 50 stops. Fort Bragg's grid layout makes straight-line distance a good proxy for road distance.

## Multi-Stop Navigation Export

- **Google Maps:** `https://www.google.com/maps/dir/LAT1,LNG1/LAT2,LNG2/.../LATN,LNGN` (max 10 waypoints per URL; split into legs for more)
- **Apple Maps:** Single destination only — show "Next Stop" sequential flow
- **Waze:** Single destination only — show "Next Stop" sequential flow

## Additional Features

- **Delivery checklist:** Tap to mark each stop as "delivered", persisted in localStorage
- **Route summary:** Copyable text with all stops (building number, name, MGRS, Plus Code)
- **Gate info banner:** Shows at top when starting from H1575 with access requirements
- **Share route:** Copy formatted text list of all stops

## Data Points

- Bldg H1575: "Gate Vehicle Inspection" at 35.1221341, -78.9791632 (MGRS: 17SPU8414388456)
- Building 110: "VISITOR CENTER" at 35.1624076, -79.0017226
- Fort Bragg: 5,668 buildings, all with GPS + MGRS + Plus Code

## Out of Scope (YAGNI)

- No backend changes or new API endpoints
- No user accounts or server-side route persistence
- No real-time tracking or live location sharing
- No delivery scheduling or time windows
- No turn-by-turn navigation (delegates to Google Maps/Waze/Apple Maps)
- No restricted area / no-go zone data (not in current dataset)
