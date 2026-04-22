-- Migration: Add packaging/unit tracking for items and prices
-- This allows accurate price comparison when items are sold in different package sizes

-- Add unit tracking to items
ALTER TABLE items ADD COLUMN unit_name TEXT DEFAULT 'each'; -- each, pair, pack, etc.

-- Add package size to prices (how many units per package at this store)
ALTER TABLE prices ADD COLUMN package_qty INTEGER DEFAULT 1; -- e.g., 6 for a 6-pack
ALTER TABLE prices ADD COLUMN package_name TEXT; -- e.g., "6-pack", "box of 12", etc.

-- Update some example items with units
UPDATE items SET unit_name = 'pair' WHERE name LIKE '%sock%' OR name LIKE '%Sock%';
UPDATE items SET unit_name = 'pair' WHERE name LIKE '%boot%' OR name LIKE '%Boot%';
UPDATE items SET unit_name = 'pair' WHERE name LIKE '%glove%' OR name LIKE '%Glove%';
UPDATE items SET unit_name = 'set' WHERE name LIKE '%kit%' OR name LIKE '%Kit%';

-- Example: Update existing prices with package info (if any)
-- These would normally be set when users submit prices
