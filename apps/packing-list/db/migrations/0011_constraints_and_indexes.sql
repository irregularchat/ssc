-- Add missing indexes for common queries
CREATE INDEX IF NOT EXISTS idx_items_asin ON items(asin);
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);
CREATE INDEX IF NOT EXISTS idx_stores_city ON stores(city);
CREATE INDEX IF NOT EXISTS idx_stores_state ON stores(state);
CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(last_verified);
CREATE INDEX IF NOT EXISTS idx_packing_lists_type ON packing_lists(type);
CREATE INDEX IF NOT EXISTS idx_packing_lists_public ON packing_lists(is_public);

-- Note: SQLite does not support ALTER TABLE ADD CONSTRAINT for foreign keys.
-- FK constraints were defined in 0001_initial.sql at table creation time.
-- To add ON DELETE CASCADE/SET NULL would require recreating tables, which
-- is risky for production data. Documenting the desired state here:
--
-- DESIRED (for future table recreation):
--   packing_lists.school_id → ON DELETE SET NULL
--   packing_lists.base_id → ON DELETE SET NULL
--   prices.item_id → ON DELETE CASCADE
--   prices.store_id → ON DELETE CASCADE
--   packing_list_items.item_id → ON DELETE CASCADE
