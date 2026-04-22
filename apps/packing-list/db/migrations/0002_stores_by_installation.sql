-- Migration: Add installation-based store organization
-- Stores can be linked to bases, online stores serve all CONUS

-- Add new columns to stores
ALTER TABLE stores ADD COLUMN is_online INTEGER DEFAULT 0;
ALTER TABLE stores ADD COLUMN store_type TEXT; -- PX, Commissary, Walmart, Target, Amazon, etc.
ALTER TABLE stores ADD COLUMN base_id INTEGER REFERENCES bases(id);

-- Create index for base lookups
CREATE INDEX IF NOT EXISTS idx_stores_base ON stores(base_id);
CREATE INDEX IF NOT EXISTS idx_stores_online ON stores(is_online);

-- Add state/region to bases for filtering
ALTER TABLE bases ADD COLUMN state TEXT;
ALTER TABLE bases ADD COLUMN region TEXT; -- CONUS, OCONUS, etc.

-- Seed major US Army installations
INSERT INTO bases (name, abbreviation, branch, state, region, location) VALUES
-- East Coast
('Fort Liberty', 'Liberty', 'Army', 'NC', 'CONUS', 'Fayetteville, NC'),
('Fort Jackson', 'Jackson', 'Army', 'SC', 'CONUS', 'Columbia, SC'),
('Fort Benning', 'Benning', 'Army', 'GA', 'CONUS', 'Columbus, GA'),
('Fort Stewart', 'Stewart', 'Army', 'GA', 'CONUS', 'Hinesville, GA'),
('Fort Gordon', 'Gordon', 'Army', 'GA', 'CONUS', 'Augusta, GA'),
('Fort Campbell', 'Campbell', 'Army', 'KY', 'CONUS', 'Fort Campbell, KY'),
('Fort Knox', 'Knox', 'Army', 'KY', 'CONUS', 'Fort Knox, KY'),
('Fort Drum', 'Drum', 'Army', 'NY', 'CONUS', 'Watertown, NY'),
('Fort Meade', 'Meade', 'Army', 'MD', 'CONUS', 'Fort Meade, MD'),
('Fort Lee', 'Lee', 'Army', 'VA', 'CONUS', 'Petersburg, VA'),
-- Central/South
('Fort Hood', 'Hood', 'Army', 'TX', 'CONUS', 'Killeen, TX'),
('Fort Bliss', 'Bliss', 'Army', 'TX', 'CONUS', 'El Paso, TX'),
('Fort Sam Houston', 'Sam Houston', 'Army', 'TX', 'CONUS', 'San Antonio, TX'),
('Fort Polk', 'Polk', 'Army', 'LA', 'CONUS', 'Leesville, LA'),
('Fort Sill', 'Sill', 'Army', 'OK', 'CONUS', 'Lawton, OK'),
('Fort Riley', 'Riley', 'Army', 'KS', 'CONUS', 'Junction City, KS'),
('Fort Leavenworth', 'Leavenworth', 'Army', 'KS', 'CONUS', 'Leavenworth, KS'),
('Fort Leonard Wood', 'Leonard Wood', 'Army', 'MO', 'CONUS', 'Fort Leonard Wood, MO'),
-- West Coast
('Fort Lewis', 'Lewis', 'Army', 'WA', 'CONUS', 'Tacoma, WA'),
('Fort Irwin', 'Irwin', 'Army', 'CA', 'CONUS', 'Barstow, CA'),
('Fort Hunter Liggett', 'Hunter Liggett', 'Army', 'CA', 'CONUS', 'Jolon, CA'),
('Fort Carson', 'Carson', 'Army', 'CO', 'CONUS', 'Colorado Springs, CO'),
-- Alaska/Hawaii
('Fort Wainwright', 'Wainwright', 'Army', 'AK', 'OCONUS', 'Fairbanks, AK'),
('Fort Richardson', 'Richardson', 'Army', 'AK', 'OCONUS', 'Anchorage, AK'),
('Schofield Barracks', 'Schofield', 'Army', 'HI', 'OCONUS', 'Wahiawa, HI'),
-- Other Branches (major training bases)
('Naval Station Great Lakes', 'Great Lakes', 'Navy', 'IL', 'CONUS', 'Great Lakes, IL'),
('Marine Corps Recruit Depot San Diego', 'MCRD SD', 'Marines', 'CA', 'CONUS', 'San Diego, CA'),
('Marine Corps Recruit Depot Parris Island', 'MCRD PI', 'Marines', 'SC', 'CONUS', 'Parris Island, SC'),
('Lackland AFB', 'Lackland', 'Air Force', 'TX', 'CONUS', 'San Antonio, TX'),
('Keesler AFB', 'Keesler', 'Air Force', 'MS', 'CONUS', 'Biloxi, MS');

-- Get Fort Liberty's ID for seeding stores
-- We'll use a subquery pattern since D1 doesn't support variables

-- Seed online stores (serve all CONUS)
INSERT INTO stores (name, store_type, is_online, website, city, state) VALUES
('Amazon', 'Online', 1, 'https://amazon.com', NULL, NULL),
('Walmart.com', 'Online', 1, 'https://walmart.com', NULL, NULL),
('Target.com', 'Online', 1, 'https://target.com', NULL, NULL),
('Military Clothing Sales Online', 'Online', 1, 'https://shopmyexchange.com', NULL, NULL),
('AAFES Online', 'PX', 1, 'https://shopmyexchange.com', NULL, NULL),
('Ranger Joes', 'Military Surplus', 1, 'https://rangerjoes.com', NULL, NULL),
('US Patriot Tactical', 'Military Surplus', 1, 'https://uspatriottactical.com', NULL, NULL);

-- Seed Fort Liberty area stores (example - base_id will be set after)
INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Main Post Exchange', 'PX', 0, 'Building 4-2843', 'Fort Liberty', 'NC', id
FROM bases WHERE abbreviation = 'Liberty';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Commissary', 'Commissary', 0, 'Gruber Road', 'Fort Liberty', 'NC', id
FROM bases WHERE abbreviation = 'Liberty';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Clothing Sales', 'Military Clothing', 0, 'Building 4-2843', 'Fort Liberty', 'NC', id
FROM bases WHERE abbreviation = 'Liberty';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Walmart Supercenter - Skibo Rd', 'Walmart', 0, '1550 Skibo Rd', 'Fayetteville', 'NC', id
FROM bases WHERE abbreviation = 'Liberty';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Walmart Supercenter - Raeford Rd', 'Walmart', 0, '4601 Ramsey St', 'Fayetteville', 'NC', id
FROM bases WHERE abbreviation = 'Liberty';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Target - Cross Creek', 'Target', 0, '300 Cross Creek Mall', 'Fayetteville', 'NC', id
FROM bases WHERE abbreviation = 'Liberty';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Rangers Surplus', 'Military Surplus', 0, '5450 Yadkin Rd', 'Fayetteville', 'NC', id
FROM bases WHERE abbreviation = 'Liberty';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Brigade Quartermaster', 'Military Surplus', 0, '1201 Bragg Blvd', 'Fayetteville', 'NC', id
FROM bases WHERE abbreviation = 'Liberty';

-- Seed Fort Jackson area stores
INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Main Post Exchange', 'PX', 0, 'Strom Thurmond Blvd', 'Fort Jackson', 'SC', id
FROM bases WHERE abbreviation = 'Jackson';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Commissary', 'Commissary', 0, 'Building 4500', 'Fort Jackson', 'SC', id
FROM bases WHERE abbreviation = 'Jackson';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Clothing Sales', 'Military Clothing', 0, 'Building 4500', 'Fort Jackson', 'SC', id
FROM bases WHERE abbreviation = 'Jackson';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Walmart - Forest Dr', 'Walmart', 0, '10060 Two Notch Rd', 'Columbia', 'SC', id
FROM bases WHERE abbreviation = 'Jackson';

-- Seed Fort Benning area stores
INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Main Post Exchange', 'PX', 0, 'Ingersoll St', 'Fort Benning', 'GA', id
FROM bases WHERE abbreviation = 'Benning';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Commissary', 'Commissary', 0, 'Custer Rd', 'Fort Benning', 'GA', id
FROM bases WHERE abbreviation = 'Benning';

INSERT INTO stores (name, store_type, is_online, address, city, state, base_id)
SELECT 'Ranger Joes Columbus', 'Military Surplus', 0, '2831 Victory Dr', 'Columbus', 'GA', id
FROM bases WHERE abbreviation = 'Benning';
