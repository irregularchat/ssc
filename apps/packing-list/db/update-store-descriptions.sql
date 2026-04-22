-- Update Fort Bragg stores with detailed product categories
-- Generated from web research 2026-02-05

-- All American Military Surplus
UPDATE stores SET
  website = 'https://www.allamericansurplus.com'
WHERE name = 'All American Military Surplus';

-- Red Horse Military Surplus (Veteran Owned since 2005)
UPDATE stores SET
  website = 'https://www.redhorsemilitarysurplus.com'
WHERE name = 'Red Horse Military Surplus';

-- Drop Zone Military Surplus
UPDATE stores SET
  website = 'https://www.dropzonesurplus.com'
WHERE name = 'Drop Zone Military Surplus';

-- General Jackson's (Since 1983)
UPDATE stores SET
  website = 'https://genjax.com'
WHERE name = 'General Jackson''s';

-- Skull and Dagger Tactical
UPDATE stores SET
  website = 'https://www.skullanddaggertactical.com'
WHERE name = 'Skull and Dagger Tactical';

-- Carolina Military Supplies
UPDATE stores SET
  website = 'https://www.carolinamilitarysupplies.com'
WHERE name = 'Carolina Military Supplies';

-- Black Sheep Surplus
UPDATE stores SET
  website = 'https://www.blacksheepsurplus.com'
WHERE name = 'Black Sheep Surplus';

-- Shooters Supply
UPDATE stores SET
  website = 'http://shooters-supply.net'
WHERE name = 'Shooters Supply';

-- Create store_categories table if not exists
CREATE TABLE IF NOT EXISTS store_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT,
  brands TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(store_id, category, subcategory)
);

-- All American Military Surplus Categories
INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Footwear', 'Combat Boots', 'Army, Tactical, Work Boots', 'Wide selection'
FROM stores WHERE name = 'All American Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Uniforms', 'OCP/ACU', 'Condor', 'Military uniforms, combat shirts'
FROM stores WHERE name = 'All American Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Tactical Gear', 'Plate Carriers', 'Blackhawk', 'Plate carriers, chest rigs, MOLLE pouches'
FROM stores WHERE name = 'All American Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Field Gear', 'Hydration', NULL, 'CamelBak, hydration systems'
FROM stores WHERE name = 'All American Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Field Gear', 'Backpacks/Rucks', 'Tasmanian Tiger', 'Rucksacks, assault packs'
FROM stores WHERE name = 'All American Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Helmets', 'ACH/MICH', NULL, 'Helmets and accessories'
FROM stores WHERE name = 'All American Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Medical', 'IFAK', NULL, 'Medical supplies, IFAKs'
FROM stores WHERE name = 'All American Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Camping/Survival', 'General', NULL, 'Camping gear, survival equipment, MREs'
FROM stores WHERE name = 'All American Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'CIF Turn-In', 'TA-50', NULL, 'Buys and trades military items'
FROM stores WHERE name = 'All American Military Surplus';

-- General Jackson's Categories (Since 1983)
INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Uniforms', 'OCP/ACU/ASU', '5.11, Propper, Tru-Spec', 'Full uniform selection'
FROM stores WHERE name = 'General Jackson''s';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Footwear', 'Combat Boots', 'Corcoran, Rocky, Garmont, Oakley', 'Extensive boot selection'
FROM stores WHERE name = 'General Jackson''s';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Bags/Packs', 'Assault Packs', '5.11, Blackhawk, Sandpiper', 'Wide selection of packs'
FROM stores WHERE name = 'General Jackson''s';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Field Gear', 'Hydration', 'CamelBak, Blackhawk, Source', 'Hydration systems'
FROM stores WHERE name = 'General Jackson''s';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Field Gear', 'Sleep Systems', NULL, 'Poncho liners (woobies), sleep systems'
FROM stores WHERE name = 'General Jackson''s';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Insignia', 'Rank/Patches', NULL, 'ASU rank, OCP rank, unit patches, badges'
FROM stores WHERE name = 'General Jackson''s';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'PT Gear', 'APFU', 'Under Armour', 'PT uniforms, athletic wear'
FROM stores WHERE name = 'General Jackson''s';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Holsters', 'Duty/Concealment', NULL, '92F-Beretta holsters, gun cleaning'
FROM stores WHERE name = 'General Jackson''s';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Services', 'Sewing', NULL, 'On-site sewing services'
FROM stores WHERE name = 'General Jackson''s';

-- Red Horse Military Surplus (Veteran Owned)
INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Tactical Gear', 'Vests/Carriers', 'Condor, T3, Blue Force Gear, Esstac', 'Tactical vests and plate carriers'
FROM stores WHERE name = 'Red Horse Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Uniforms', 'OCP', 'Rothco, JNB', 'New and used uniforms'
FROM stores WHERE name = 'Red Horse Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Field Gear', 'Pouches', 'Gear Dynamics, Unobtanium Gear', 'MOLLE pouches and accessories'
FROM stores WHERE name = 'Red Horse Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Trade-In', 'Used Gear', NULL, 'Buys/trades used military gear'
FROM stores WHERE name = 'Red Horse Military Surplus';

-- Drop Zone Military Surplus
INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Tactical Gear', 'Premium', 'Blue Force Gear, High-Speed Gear, Raptor Gear', 'Stocking dealer for premium brands'
FROM stores WHERE name = 'Drop Zone Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Uniforms', 'PT Shorts', NULL, 'Military-issue PT gear'
FROM stores WHERE name = 'Drop Zone Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Pouches', 'Magazine', NULL, 'Mag pouches, tool covers'
FROM stores WHERE name = 'Drop Zone Military Surplus';

-- Skull and Dagger Tactical
INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Tactical Gear', 'General', 'Grey Ghost Gear, Esstac, Tactical Tailor, VISM', 'Wide selection tactical gear'
FROM stores WHERE name = 'Skull and Dagger Tactical';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Footwear', 'Boots', NULL, 'Combat and tactical boots'
FROM stores WHERE name = 'Skull and Dagger Tactical';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Uniforms', 'BDU/OCP', 'Condor, Rothco', 'Camouflage apparel'
FROM stores WHERE name = 'Skull and Dagger Tactical';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'EDC', 'Knives/Lights', 'Maxtacs', 'Everyday carry flashlights and knives'
FROM stores WHERE name = 'Skull and Dagger Tactical';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Medical', 'Tactical Medicine', NULL, 'Tactical medicine kits, IFAKs'
FROM stores WHERE name = 'Skull and Dagger Tactical';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Coffee', 'Specialty', 'Black Rifle Coffee', 'Premium veteran-owned coffee'
FROM stores WHERE name = 'Skull and Dagger Tactical';

-- Carolina Military Supplies
INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Tactical Gear', 'Premium', 'RAPTOR Tactical, Tactical Tailor, Esstac', 'High-quality tactical gear'
FROM stores WHERE name = 'Carolina Military Supplies';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Footwear', 'Combat Boots', NULL, 'Wide selection of boots'
FROM stores WHERE name = 'Carolina Military Supplies';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Uniforms', 'Multicam/OCP', NULL, 'Multicam and OCP uniforms'
FROM stores WHERE name = 'Carolina Military Supplies';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'CIF Turn-In', 'TA-50', NULL, 'CIF turn-in items, packing list items'
FROM stores WHERE name = 'Carolina Military Supplies';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Books', 'Ranger Handbook', NULL, 'Tear-proof/waterproof Ranger Handbooks'
FROM stores WHERE name = 'Carolina Military Supplies';

-- Black Sheep Surplus (Southern Pines)
INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'CIF Turn-In', 'TA-50', NULL, 'Buys/sells/trades TA-50'
FROM stores WHERE name = 'Black Sheep Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Footwear', 'Boots', '5.11, Danner', 'Combat and tactical boots'
FROM stores WHERE name = 'Black Sheep Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Knives', 'Tactical', 'Benchmade, Gerber, SOG, Stroup Knives', 'Wide knife selection including veteran-owned Stroup'
FROM stores WHERE name = 'Black Sheep Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Bags/Packs', 'Rucks', 'Blackhawk, Eagle Industries', 'Packs and rucksacks'
FROM stores WHERE name = 'Black Sheep Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Tactical Gear', 'General', 'Raptor Tactical', 'Tactical gear and accessories'
FROM stores WHERE name = 'Black Sheep Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Eyewear', 'Tactical', 'Epoch Eyewear', 'Tactical sunglasses'
FROM stores WHERE name = 'Black Sheep Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Camping', 'Outdoor', NULL, 'Camping equipment, outdoor sporting goods'
FROM stores WHERE name = 'Black Sheep Surplus';

-- Silverback Military Surplus
INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Uniforms', 'OCP', NULL, 'New and used uniforms'
FROM stores WHERE name = 'Silverback Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Field Gear', 'Packs', NULL, 'Field gear and packs'
FROM stores WHERE name = 'Silverback Military Surplus';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Trade-In', 'Used Gear', NULL, 'Buys/sells/trades military gear'
FROM stores WHERE name = 'Silverback Military Surplus';

-- Shooters Supply (Firearms & Tactical since 1995)
INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Firearms', 'AR15', 'Geissele, Noveske, BCM', 'Custom AR15 builds, uppers, lowers'
FROM stores WHERE name = 'Shooters Supply';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Optics', 'Weapon Sights', 'Eotech', 'Red dots, scopes, weapon lights'
FROM stores WHERE name = 'Shooters Supply';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Tactical Gear', 'Holsters', 'Safariland, Blackhawk', 'Duty and concealment holsters'
FROM stores WHERE name = 'Shooters Supply';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Tactical Gear', 'Lights', 'Surefire', 'Weapon lights and tactical flashlights'
FROM stores WHERE name = 'Shooters Supply';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Reloading', 'Equipment', 'Dillon', 'Reloading supplies and equipment'
FROM stores WHERE name = 'Shooters Supply';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Ammo', 'General', NULL, 'Ammunition sales'
FROM stores WHERE name = 'Shooters Supply';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'NFA', 'Class 3', NULL, 'SOT dealer - silencers, SBRs, transfers'
FROM stores WHERE name = 'Shooters Supply';

INSERT OR IGNORE INTO store_categories (store_id, category, subcategory, brands, notes)
SELECT id, 'Competition', '3-Gun', NULL, '3-gun competition gear'
FROM stores WHERE name = 'Shooters Supply';
