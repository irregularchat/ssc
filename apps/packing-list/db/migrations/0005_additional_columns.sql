-- Migration: Add columns for better price comparison and military discounts

-- Packing List Items: Add priority level for items
-- 1 = Required (must buy), 2 = Recommended (should buy), 3 = Optional (nice to have)
ALTER TABLE packing_list_items ADD COLUMN priority INTEGER DEFAULT 1;
-- Source of the requirement (official list, veteran tip, drill sergeant advice)
ALTER TABLE packing_list_items ADD COLUMN source TEXT DEFAULT 'official';

-- Stores: Military discount support
ALTER TABLE stores ADD COLUMN accepts_military_discount INTEGER DEFAULT 0;
ALTER TABLE stores ADD COLUMN military_discount_pct INTEGER; -- e.g., 10 for 10% off

-- Prices: Track if price includes military discount
ALTER TABLE prices ADD COLUMN price_type TEXT DEFAULT 'regular'; -- regular, sale, military
ALTER TABLE prices ADD COLUMN military_discount_pct INTEGER; -- discount applied to get this price

-- Items: Add weight for pack weight calculation
ALTER TABLE items ADD COLUMN weight_oz REAL; -- weight in ounces
ALTER TABLE items ADD COLUMN brand_preference TEXT; -- recommended brand

-- Update seed data with military discount info for common stores
UPDATE stores SET accepts_military_discount = 1, military_discount_pct = 10
WHERE name LIKE '%Surplus%' OR name LIKE '%Military%' OR name LIKE '%Army Navy%';

-- Online stores often have military discounts
UPDATE stores SET accepts_military_discount = 1, military_discount_pct = 10
WHERE is_online = 1 AND (name LIKE '%Amazon%' OR name LIKE '%Under Armour%');
