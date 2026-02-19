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
