-- Search performance indexes for item search feature
-- Speeds up multi-column LIKE queries and price/store lookups

-- Item name index for search and dedup
CREATE INDEX IF NOT EXISTS idx_items_name ON items(name);

-- Item category index for category filtering
CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);

-- Stores: base + online flag for location-aware price queries
CREATE INDEX IF NOT EXISTS idx_stores_base_online ON stores(base_id, is_online);

-- Composite index for price bounty queries (items needing prices at a base)
CREATE INDEX IF NOT EXISTS idx_prices_item_store ON prices(item_id, store_id);
