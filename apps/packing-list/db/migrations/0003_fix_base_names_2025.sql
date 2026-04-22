-- Migration: Update base names to 2025 reverted names
-- All 9 bases renamed by the 2023 Naming Commission were reverted in 2025
-- but now honor different service members with the same names

-- Fix Fort Liberty → Fort Bragg (Roland L. Bragg, WWII Silver Star recipient)
UPDATE bases SET name = 'Fort Bragg', abbreviation = 'Bragg' WHERE abbreviation = 'Liberty';

-- Fix any stores that reference the old name
UPDATE stores SET city = 'Fayetteville' WHERE city = 'Fort Liberty';

-- Update other reverted bases (if they exist)
-- Fort Moore → Fort Benning (Corporal Fred G. Benning, WWI DSC recipient)
UPDATE bases SET name = 'Fort Benning', abbreviation = 'Benning'
WHERE name = 'Fort Moore' OR abbreviation = 'Moore';

-- Fort Cavazos → Fort Hood (Colonel Robert B. Hood, WWI hero)
UPDATE bases SET name = 'Fort Hood', abbreviation = 'Hood'
WHERE name = 'Fort Cavazos' OR abbreviation = 'Cavazos';

-- Fort Eisenhower → Fort Gordon (reverted June 2025)
UPDATE bases SET name = 'Fort Gordon', abbreviation = 'Gordon'
WHERE name = 'Fort Eisenhower' OR abbreviation = 'Eisenhower';

-- Fort Johnson → Fort Polk (reverted June 2025)
UPDATE bases SET name = 'Fort Polk', abbreviation = 'Polk'
WHERE name = 'Fort Johnson' AND state = 'LA';

-- Fort Gregg-Adams → Fort Lee (Private Fitz Lee, Spanish-American War)
UPDATE bases SET name = 'Fort Lee', abbreviation = 'Lee'
WHERE name = 'Fort Gregg-Adams' OR abbreviation = 'Gregg-Adams';

-- Fort Novosel → Fort Rucker (Captain Edward W. Rucker, WWI aviator)
UPDATE bases SET name = 'Fort Rucker', abbreviation = 'Rucker'
WHERE name = 'Fort Novosel' OR abbreviation = 'Novosel';

-- Add Fort Rucker if it doesn't exist
INSERT OR IGNORE INTO bases (name, abbreviation, branch, state, region, location)
VALUES ('Fort Rucker', 'Rucker', 'Army', 'AL', 'CONUS', 'Ozark, AL');

-- Now update stores to use the city name (not installation name) for local stores
-- This ensures filtering by installation shows stores in that city

-- Fort Bragg area stores should show Fayetteville, NC
UPDATE stores
SET city = 'Fayetteville'
WHERE base_id IN (SELECT id FROM bases WHERE abbreviation = 'Bragg')
AND is_online = 0
AND city != 'Fayetteville';

-- Fort Benning area stores should show Columbus, GA
UPDATE stores
SET city = 'Columbus'
WHERE base_id IN (SELECT id FROM bases WHERE abbreviation = 'Benning')
AND is_online = 0
AND city NOT LIKE '%Columbus%';

-- Fort Jackson stores should show Columbia, SC
UPDATE stores
SET city = 'Columbia'
WHERE base_id IN (SELECT id FROM bases WHERE abbreviation = 'Jackson')
AND is_online = 0
AND city NOT LIKE '%Columbia%';

-- Add more common store chains near Fort Bragg
INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Best Price', 'Discount', 0, 'Bragg Blvd', 'Fayetteville', 'NC', id
FROM bases WHERE abbreviation = 'Bragg';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Army Navy Store', 'Military Surplus', 0, 'Western Blvd', 'Jacksonville', 'NC', id
FROM bases WHERE abbreviation = 'Bragg';

-- Note: The "Best Price" and "Army Navy Store" from the user's screenshot
-- are stores in the Fayetteville/Jacksonville NC area serving Fort Bragg
