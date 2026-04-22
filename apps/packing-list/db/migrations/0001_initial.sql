-- Schools table
CREATE TABLE IF NOT EXISTS schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  abbreviation TEXT,
  branch TEXT,
  location TEXT,
  website TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Bases table
CREATE TABLE IF NOT EXISTS bases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  abbreviation TEXT,
  branch TEXT,
  location TEXT,
  website TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Items table
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  asin TEXT,
  image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Packing lists table
CREATE TABLE IF NOT EXISTS packing_lists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  is_public INTEGER DEFAULT 1,
  contributor_name TEXT,
  school_id INTEGER REFERENCES schools(id),
  base_id INTEGER REFERENCES bases(id),
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Packing list items (junction table)
CREATE TABLE IF NOT EXISTS packing_list_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  packing_list_id INTEGER NOT NULL REFERENCES packing_lists(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  added_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Stores table
CREATE TABLE IF NOT EXISTS stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  website TEXT,
  lat REAL,
  lng REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Prices table
CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id),
  store_id INTEGER NOT NULL REFERENCES stores(id),
  price REAL NOT NULL,
  in_stock INTEGER DEFAULT 1,
  last_verified TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  price_id INTEGER NOT NULL REFERENCES prices(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  voter_ip TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_packing_lists_school ON packing_lists(school_id);
CREATE INDEX IF NOT EXISTS idx_packing_lists_base ON packing_lists(base_id);
CREATE INDEX IF NOT EXISTS idx_packing_list_items_list ON packing_list_items(packing_list_id);
CREATE INDEX IF NOT EXISTS idx_packing_list_items_item ON packing_list_items(item_id);
CREATE INDEX IF NOT EXISTS idx_prices_item ON prices(item_id);
CREATE INDEX IF NOT EXISTS idx_prices_store ON prices(store_id);
CREATE INDEX IF NOT EXISTS idx_votes_price ON votes(price_id);
CREATE INDEX IF NOT EXISTS idx_stores_location ON stores(lat, lng);
