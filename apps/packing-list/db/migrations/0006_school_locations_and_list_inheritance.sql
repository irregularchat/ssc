-- Migration: School-Base Many-to-Many + Packing List Inheritance
--
-- 1. school_bases: Links schools to multiple bases (BCT at Fort Jackson, Benning, Sill, etc.)
-- 2. parent_list_id: Allows packing lists to inherit from a master list

-- Junction table for schools and their locations
CREATE TABLE IF NOT EXISTS school_bases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL,
  base_id INTEGER NOT NULL,
  is_primary INTEGER DEFAULT 0,  -- Primary location for this school
  notes TEXT,                     -- e.g., "Winter cycle only", "Reserve component"
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (base_id) REFERENCES bases(id) ON DELETE CASCADE,
  UNIQUE(school_id, base_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_school_bases_school ON school_bases(school_id);
CREATE INDEX IF NOT EXISTS idx_school_bases_base ON school_bases(base_id);

-- Add parent_list_id to packing_lists for inheritance
ALTER TABLE packing_lists ADD COLUMN parent_list_id INTEGER REFERENCES packing_lists(id) ON DELETE SET NULL;

-- Add override_type to packing_list_items for inherited lists
-- 'inherited' = from parent (default), 'added' = new in child, 'removed' = excluded in child, 'modified' = changed qty/priority
ALTER TABLE packing_list_items ADD COLUMN override_type TEXT DEFAULT 'inherited';

-- Index for finding child lists
CREATE INDEX IF NOT EXISTS idx_packing_lists_parent ON packing_lists(parent_list_id);
