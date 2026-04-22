-- Fort Bragg/Fort Liberty Area Military Surplus & Tactical Stores
-- Generated from web research 2026-02-05

-- All American Military Surplus
INSERT OR IGNORE INTO stores (name, store_type, is_online, address, city, state, zip, phone, website, base_id, accepts_military_discount)
SELECT 'All American Military Surplus', 'Military Surplus', 0,
       '4756 Yadkin Road', 'Fayetteville', 'NC', '28303',
       '910-491-0669', 'https://www.allamericansurplus.com',
       id, 1
FROM bases WHERE abbreviation = 'Bragg';

-- Red Horse Military Surplus (Veteran Owned)
INSERT OR IGNORE INTO stores (name, store_type, is_online, address, city, state, zip, phone, website, base_id, accepts_military_discount)
SELECT 'Red Horse Military Surplus', 'Military Surplus', 0,
       '6310 Yadkin Rd', 'Fayetteville', 'NC', '28303',
       '910-867-1125', 'https://www.redhorsemilitarysurplus.com',
       id, 1
FROM bases WHERE abbreviation = 'Bragg';

-- Drop Zone Military Surplus
INSERT OR IGNORE INTO stores (name, store_type, is_online, address, city, state, zip, phone, website, base_id, accepts_military_discount)
SELECT 'Drop Zone Military Surplus', 'Military Surplus', 0,
       '6033 Yadkin Road', 'Fayetteville', 'NC', '28303',
       '910-779-0025', 'https://www.dropzonesurplus.com',
       id, 1
FROM bases WHERE abbreviation = 'Bragg';

-- General Jackson's (Since 1983)
INSERT OR IGNORE INTO stores (name, store_type, is_online, address, city, state, zip, phone, website, base_id, accepts_military_discount)
SELECT 'General Jackson''s', 'Military Surplus', 0,
       '6207 Yadkin Rd', 'Fayetteville', 'NC', '28303',
       '910-868-1806', 'https://genjax.com',
       id, 1
FROM bases WHERE abbreviation = 'Bragg';

-- Skull and Dagger Tactical
INSERT OR IGNORE INTO stores (name, store_type, is_online, address, city, state, zip, phone, website, base_id, accepts_military_discount)
SELECT 'Skull and Dagger Tactical', 'Tactical', 0,
       '6313 Yadkin Road', 'Fayetteville', 'NC', '28303',
       '910-491-2043', 'https://www.skullanddaggertactical.com',
       id, 1
FROM bases WHERE abbreviation = 'Bragg';

-- Carolina Military Supplies (NC Military Supplies)
INSERT OR IGNORE INTO stores (name, store_type, is_online, address, city, state, zip, phone, website, base_id, accepts_military_discount)
SELECT 'Carolina Military Supplies', 'Military Surplus', 0,
       '524 S. Reilly Rd Ste 103', 'Fayetteville', 'NC', '28314',
       '910-864-5952', 'https://www.carolinamilitarysupplies.com',
       id, 1
FROM bases WHERE abbreviation = 'Bragg';

-- Black Sheep Surplus (Southern Pines - North of Fort Liberty)
INSERT OR IGNORE INTO stores (name, store_type, is_online, address, city, state, zip, phone, website, base_id, accepts_military_discount)
SELECT 'Black Sheep Surplus', 'Military Surplus', 0,
       '125 Murray Hill Rd Ste E', 'Southern Pines', 'NC', '28387',
       '910-315-0788', 'https://www.blacksheepsurplus.com',
       id, 1
FROM bases WHERE abbreviation = 'Bragg';

-- Silverback Military Surplus
INSERT OR IGNORE INTO stores (name, store_type, is_online, address, city, state, zip, phone, website, base_id, accepts_military_discount)
SELECT 'Silverback Military Surplus', 'Military Surplus', 0,
       '6477 Yadkin Rd Ste C', 'Fayetteville', 'NC', '28303',
       '910-779-0051', NULL,
       id, 1
FROM bases WHERE abbreviation = 'Bragg';

-- Shooters Supply (Tactical & Firearms since 1995)
INSERT OR IGNORE INTO stores (name, store_type, is_online, address, city, state, zip, phone, website, base_id, accepts_military_discount)
SELECT 'Shooters Supply', 'Tactical', 0,
       '5103 Bragg Blvd', 'Fayetteville', 'NC', '28303',
       '910-860-3700', 'http://shooters-supply.net',
       id, 1
FROM bases WHERE abbreviation = 'Bragg';
