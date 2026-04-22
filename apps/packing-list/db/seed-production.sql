-- Production Seed Data
-- Uses INSERT OR IGNORE / ON CONFLICT to avoid duplicates during re-deployment

-- 1. Bases (Military Installations)
INSERT OR IGNORE INTO bases (name, abbreviation, branch, location, description) VALUES
  ('Fort Liberty', 'LIBERTY', 'Army', 'Fayetteville, NC', 'Home of the Airborne and Special Operations forces (formerly Fort Bragg)'),
  ('Fort Moore', 'MOORE', 'Army', 'Columbus, GA', 'Home of the Infantry and Armor (formerly Fort Benning)'),
  ('Fort Novosel', 'NOVOSEL', 'Army', 'Daleville, AL', 'Home of Army Aviation (formerly Fort Rucker)'),
  ('Camp Lejeune', 'LEJEUNE', 'Marines', 'Jacksonville, NC', 'Major Marine Corps base'),
  ('Naval Station Norfolk', 'NORFOLK', 'Navy', 'Norfolk, VA', 'Largest naval station in the world'),
  ('Joint Base Lewis-McChord', 'JBLM', 'Joint', 'Tacoma, WA', 'Major Army and Air Force installation'),
  ('Fort Campbell', 'CAMPBELL', 'Army', 'Clarksville, TN', 'Home of the 101st Airborne Division'),
  ('Fairchild AFB', 'FAIRCHILD', 'Air Force', 'Spokane, WA', 'Home of Air Force SERE Training'),
  ('Fort Jackson', 'JACKSON', 'Army', 'Columbia, SC', 'Primary Basic Combat Training location'),
  ('Fort Sill', 'SILL', 'Army', 'Lawton, OK', 'Field Artillery School'),
  ('Fort Leonard Wood', 'LEONARDWOOD', 'Army', 'St. Robert, MO', 'Maneuver Support Center of Excellence'),
  ('MCRD San Diego', 'MCRD-SD', 'Marines', 'San Diego, CA', 'Marine Corps Recruit Depot'),
  ('MCRD Parris Island', 'MCRD-PI', 'Marines', 'Beaufort, SC', 'Marine Corps Recruit Depot'),
  ('Lackland AFB', 'LACKLAND', 'Air Force', 'San Antonio, TX', 'Home of Air Force Basic Military Training'),
  ('Great Lakes', 'GREATLAKES', 'Navy', 'North Chicago, IL', 'Navy Recruit Training Command');

-- 2. Schools (Training Programs)
INSERT OR IGNORE INTO schools (name, abbreviation, branch, location, description) VALUES
  ('Army Basic Combat Training', 'BCT', 'Army', 'Various', 'Initial entry training for Army enlisted personnel'),
  ('Marine Corps Recruit Depot', 'MCRD', 'Marines', 'Various', 'Marine Corps boot camp'),
  ('Air Force Basic Military Training', 'BMT', 'Air Force', 'Lackland AFB, TX', 'Air Force basic training'),
  ('Navy Recruit Training Command', 'RTC', 'Navy', 'Great Lakes, IL', 'Navy boot camp'),
  ('Army Ranger School', 'Ranger', 'Army', 'Fort Moore, GA', 'Premier leadership and small unit tactics course. v.11 (Sept 2025) update.'),
  ('Army Airborne School', 'Airborne', 'Army', 'Fort Moore, GA', 'Basic paratrooper training (Jump School). 2024-2025 update.'),
  ('Special Forces Assessment and Selection', 'SFAS', 'Army', 'Fort Liberty, NC', 'Special Forces candidate assessment. 2024-2025 strict sterile gear list.'),
  ('Psychological Operations Assessment and Selection', 'POAS', 'Army', 'Fort Liberty, NC', 'PSYOP candidate assessment and selection.'),
  ('Civil Affairs Assessment and Selection', 'CAAS', 'Army', 'Fort Liberty, NC', 'CA candidate assessment and selection.'),
  ('Small Unit Tactics (Q-Course Phase)', 'SUT', 'Army', 'Fort Liberty, NC', 'Tactical field operations phase of SF Qualification Course.'),
  ('Air Assault School', 'Air Assault', 'Army', 'Fort Campbell, KY', 'Helicopter operations and rappelling course. Lightning Academy/TSAAS 2024 list.'),
  ('Jumpmaster School', 'Jumpmaster', 'Army', 'Fort Moore, GA', 'Advanced paratrooper leadership and safety course. July 2023 update.'),
  ('SERE School (Level C)', 'SERE', 'Army', 'Fort Liberty, NC', 'Survival, Evasion, Resistance, and Escape. High risk of capture training.');

-- 3. School Locations (Many-to-Many Links)
-- Helper Query to link IDs (SQLite doesn't support nested SELECTs well in VALUES for bulk inserts, doing individually or with specific lookups is safer)

-- Link BCT
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 1, 'Primary BCT location' FROM schools s, bases b WHERE s.abbreviation = 'BCT' AND b.abbreviation = 'JACKSON';
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 0, 'Infantry/Armor OSUT' FROM schools s, bases b WHERE s.abbreviation = 'BCT' AND b.abbreviation = 'MOORE';
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 0, 'Field Artillery OSUT' FROM schools s, bases b WHERE s.abbreviation = 'BCT' AND b.abbreviation = 'SILL';
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 0, 'Engineer/MP OSUT' FROM schools s, bases b WHERE s.abbreviation = 'BCT' AND b.abbreviation = 'LEONARDWOOD';

-- Link Ranger
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1 FROM schools s, bases b WHERE s.abbreviation = 'Ranger' AND b.abbreviation = 'MOORE';

-- Link Airborne
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1 FROM schools s, bases b WHERE s.abbreviation = 'Airborne' AND b.abbreviation = 'MOORE';

-- Link SFAS/POAS/CAAS/SUT to Liberty (Bragg)
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1 FROM schools s, bases b WHERE s.abbreviation IN ('SFAS', 'POAS', 'CAAS', 'SUT') AND b.abbreviation = 'LIBERTY';

-- Link Air Assault
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1 FROM schools s, bases b WHERE s.abbreviation = 'Air Assault' AND b.abbreviation = 'CAMPBELL';

-- Link Jumpmaster
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1 FROM schools s, bases b WHERE s.abbreviation = 'Jumpmaster' AND b.abbreviation = 'MOORE';

-- Link SERE to Liberty (Camp Mackall) and Novosel
INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 1, 'Camp Mackall (Main Army SERE)' FROM schools s, bases b WHERE s.abbreviation = 'SERE' AND b.abbreviation = 'LIBERTY';

INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 0, 'Aviation SERE' FROM schools s, bases b WHERE s.abbreviation = 'SERE' AND b.abbreviation = 'NOVOSEL';

INSERT OR IGNORE INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 0, 'Air Force SERE' FROM schools s, bases b WHERE s.abbreviation = 'SERE' AND b.abbreviation = 'FAIRCHILD';-- Add Items for Ranger School
INSERT INTO items (name, description, category, asin) VALUES
  ('Army Combat Boots', 'Black or coyote brown, broken in. Must be fully broken in. Bring 2 pairs minimum', 'Uniforms and Clothing', 'NSN 8430-01-514-4933'),
  ('OCP Uniform Set', 'Complete with all patches sewn. Ranger tab location sewn on left shoulder. Name tape, rank, US Army', 'Uniforms and Clothing', 'NSN 8415-01-645-2768'),
  ('APFU (PT Uniform)', 'Army PT uniform with reflective. Must be current APFU, not IPFU. Bring shorts and pants', 'Uniforms and Clothing', 'NSN 8415-01-584-5665'),
  ('Socks (Boot)', 'Green or tan boot socks. Wool blend recommended. Change daily to prevent blisters', 'Uniforms and Clothing', 'NSN 8440-01-504-8208'),
  ('Rucksack (Large)', 'MOLLE II Large Rucksack. Main rucksack for all field exercises', 'Field Gear', 'NSN 8465-01-524-7226'),
  ('Sleep System (Modular)', 'Complete MSS with patrol bag. Green or woodland. Rated to -40°F', 'Field Gear', 'NSN 8465-01-547-2577'),
  ('Poncho Liner (Woobie)', 'Poncho liner, nylon quilted. Essential for warmth. Bring 2', 'Field Gear', 'NSN 8405-01-547-0827'),
  ('Foot Powder', 'Gold Bond or similar. Essential for foot care. Prevents blisters', 'Hygiene and Medical', 'NSN 6505-01-314-0613'),
  ('Headlamp', 'LED headlamp with red light. Hands-free light. Red light for tactical', 'Tools and Equipment', 'NSN 6230-01-563-7914'),
  ('Map Markers', 'Fine tip. Non-permanent', 'Navigation and Communication', 'N/A'),
  ('Pace Beads', 'Ranger beads. Land nav essential', 'Navigation and Communication', 'NSN 6675-01-509-3265');

-- Ranger School Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Ranger School Packing List 2025', 'Official packing list for Ranger School candidates (Updated January 2025). Source: Airborne and Ranger Training Brigade (ARTB), Fort Moore.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'MOORE'), 'Admin'
FROM schools WHERE abbreviation = 'Ranger';

-- Link Items to Ranger List
INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Must be fully broken in', 'Uniforms and Clothing', 1
FROM packing_lists pl, items i WHERE pl.name = 'Ranger School Packing List 2025' AND i.name = 'Army Combat Boots';

INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Complete with all patches sewn', 'Uniforms and Clothing', 1
FROM packing_lists pl, items i WHERE pl.name = 'Ranger School Packing List 2025' AND i.name = 'OCP Uniform Set';

INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 12, 'Change daily', 'Uniforms and Clothing', 1
FROM packing_lists pl, items i WHERE pl.name = 'Ranger School Packing List 2025' AND i.name = 'Socks (Boot)';

INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Main ruck', 'Field Gear', 1
FROM packing_lists pl, items i WHERE pl.name = 'Ranger School Packing List 2025' AND i.name = 'Rucksack (Large)';

INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Essential for warmth', 'Field Gear', 1
FROM packing_lists pl, items i WHERE pl.name = 'Ranger School Packing List 2025' AND i.name = 'Poncho Liner (Woobie)';

-- SERE Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'SERE Level C Packing List (Army)', 'Official packing list for Army SERE Level C at Camp Mackall (Fort Liberty) and Fort Novosel.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'LIBERTY'), 'Admin'
FROM schools WHERE abbreviation = 'SERE';

-- Add Items unique to SERE (reusing common ones where possible by name matches if I expanded the item inserts above, but adding specific ones here)
INSERT INTO items (name, description, category, asin) VALUES
  ('Survival Kit - Sewing', 'Needle, thread, buttons. Repair and improvisation', 'Survival Kit', 'N/A'),
  ('Survival Kit - Fishing Line', 'Monofilament 5-30lb. 50 feet', 'Survival Kit', 'N/A'),
  ('Survival Kit - Manmade Tinder', 'Cotton balls w/ vaseline. Quart bag full. No matches/lighters', 'Survival Kit', 'N/A'),
  ('Mesh Laundry Bag', 'Mesh bag for laundry', 'Hygiene and Medical', 'N/A');

-- Link Items to SERE List
INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Worn during in-processing', 'Mandatory Worn', 1
FROM packing_lists pl, items i WHERE pl.name = 'SERE Level C Packing List (Army)' AND i.name = 'OCP Uniform Set';

INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Worn pair', 'Mandatory Worn', 1
FROM packing_lists pl, items i WHERE pl.name = 'SERE Level C Packing List (Army)' AND i.name = 'Army Combat Boots';

INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Repair and improvisation', 'Survival Kit', 1
FROM packing_lists pl, items i WHERE pl.name = 'SERE Level C Packing List (Army)' AND i.name = 'Survival Kit - Sewing';

INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Quart bag full', 'Survival Kit', 1
FROM packing_lists pl, items i WHERE pl.name = 'SERE Level C Packing List (Army)' AND i.name = 'Survival Kit - Manmade Tinder';
