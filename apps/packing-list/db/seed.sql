-- Sample Schools
INSERT INTO schools (name, abbreviation, branch, location, description) VALUES
  ('Army Basic Combat Training', 'BCT', 'Army', 'Fort Jackson, SC', 'Initial entry training for Army enlisted personnel'),
  ('Marine Corps Recruit Depot', 'MCRD', 'Marines', 'San Diego, CA', 'Marine Corps boot camp'),
  ('Air Force Basic Military Training', 'BMT', 'Air Force', 'Lackland AFB, TX', 'Air Force basic training'),
  ('Navy Recruit Training Command', 'RTC', 'Navy', 'Great Lakes, IL', 'Navy boot camp'),
  ('Army Ranger School', 'Ranger', 'Army', 'Fort Moore, GA', 'Premier leadership and small unit tactics course'),
  ('Army Airborne School', 'Airborne', 'Army', 'Fort Moore, GA', 'Basic paratrooper training (Jump School)'),
  ('Special Forces Assessment and Selection', 'SFAS', 'Army', 'Fort Liberty, NC', 'Special Forces candidate assessment'),
  ('Psychological Operations Assessment and Selection', 'POAS', 'Army', 'Fort Liberty, NC', 'PSYOP candidate assessment and selection'),
  ('Civil Affairs Assessment and Selection', 'CAAS', 'Army', 'Fort Liberty, NC', 'CA candidate assessment and selection'),
  ('Small Unit Tactics (Q-Course Phase)', 'SUT', 'Army', 'Fort Liberty, NC', 'Tactical field operations phase of SF Qualification Course'),
  ('Air Assault School', 'Air Assault', 'Army', 'Fort Campbell, KY', 'Helicopter operations and rappelling course'),
  ('Jumpmaster School', 'Jumpmaster', 'Army', 'Fort Moore, GA', 'Advanced paratrooper leadership and safety course'),
  ('SERE School (Level C)', 'SERE', 'Army', 'Fort Liberty, NC', 'Survival, Evasion, Resistance, and Escape. High risk of capture training.');

-- Sample Bases
INSERT INTO bases (name, abbreviation, branch, location, description) VALUES
  ('Fort Liberty', 'LIBERTY', 'Army', 'Fayetteville, NC', 'Home of the Airborne and Special Operations forces (formerly Fort Bragg)'),
  ('Camp Lejeune', 'LEJEUNE', 'Marines', 'Jacksonville, NC', 'Major Marine Corps base'),
  ('Naval Station Norfolk', 'NORFOLK', 'Navy', 'Norfolk, VA', 'Largest naval station in the world'),
  ('Joint Base Lewis-McChord', 'JBLM', 'Joint', 'Tacoma, WA', 'Major Army and Air Force installation'),
  ('Fort Moore', 'MOORE', 'Army', 'Columbus, GA', 'Home of the Infantry and Armor (formerly Fort Benning)'),
  ('Fort Novosel', 'NOVOSEL', 'Army', 'Daleville, AL', 'Home of Army Aviation (formerly Fort Rucker)'),
  ('Fairchild AFB', 'FAIRCHILD', 'Air Force', 'Spokane, WA', 'Home of Air Force SERE Training'),
  ('Fort Campbell', 'CAMPBELL', 'Army', 'Clarksville, TN', 'Home of the 101st Airborne Division');

-- Link Schools to Bases
INSERT INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1
FROM schools s, bases b
WHERE s.abbreviation = 'Ranger' AND b.abbreviation = 'MOORE';

INSERT INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1
FROM schools s, bases b
WHERE s.abbreviation = 'Airborne' AND b.abbreviation = 'MOORE';

INSERT INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1
FROM schools s, bases b
WHERE s.abbreviation IN ('SFAS', 'POAS', 'CAAS', 'SUT') AND b.abbreviation = 'LIBERTY';

INSERT INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1
FROM schools s, bases b
WHERE s.abbreviation = 'Jumpmaster' AND b.abbreviation = 'MOORE';

INSERT INTO school_bases (school_id, base_id, is_primary)
SELECT s.id, b.id, 1
FROM schools s, bases b
WHERE s.abbreviation = 'Air Assault' AND b.abbreviation = 'CAMPBELL';

INSERT INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 1, 'Camp Mackall (Main Army SERE)'
FROM schools s, bases b
WHERE s.abbreviation = 'SERE' AND b.abbreviation = 'LIBERTY';

INSERT INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 0, 'Aviation SERE'
FROM schools s, bases b
WHERE s.abbreviation = 'SERE' AND b.abbreviation = 'NOVOSEL';

INSERT INTO school_bases (school_id, base_id, is_primary, notes)
SELECT s.id, b.id, 0, 'Air Force SERE'
FROM schools s, bases b
WHERE s.abbreviation = 'SERE' AND b.abbreviation = 'FAIRCHILD';

-- Sample Items
INSERT INTO items (name, description, category, asin) VALUES
  ('Black Boot Socks', '6-pack athletic boot socks', 'Clothing', 'B08XXXXX01'),
  ('Boot Care Kit', 'Complete boot polish and maintenance kit', 'Footwear', 'B08XXXXX02'),
  ('Padlock Set', 'Combination locks for wall and foot lockers', 'Security', 'B08XXXXX03'),
  ('White T-Shirts', '6-pack plain white undershirts', 'Clothing', 'B08XXXXX04'),
  ('Toiletry Bag', 'Black toiletry organizer', 'Personal Care', 'B08XXXXX05'),
  ('Running Shoes', 'Athletic training shoes', 'Footwear', 'B08XXXXX06'),
  ('Notebook', 'Waterproof tactical notebook', 'Supplies', 'B08XXXXX07'),
  ('Flashlight', 'Red lens tactical flashlight', 'Equipment', 'B08XXXXX08');

-- Sample Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name) VALUES
  ('BCT Essentials', 'Everything you need for Army Basic Combat Training', 'Basic Training', 1, 1, 'Anonymous Veteran');

-- Add items to list
INSERT INTO packing_list_items (packing_list_id, item_id, quantity, notes) VALUES
  (1, 1, 6, 'Get extra pairs'),
  (1, 2, 1, 'Kiwi brand recommended'),
  (1, 3, 2, 'One for wall locker, one for foot locker'),
  (1, 4, 6, 'Crew neck required'),
  (1, 5, 1, NULL),
  (1, 6, 1, 'Break them in before shipping'),
  (1, 7, 2, 'For notes and studying'),
  (1, 8, 1, 'Red lens only');

-- Sample Stores
INSERT INTO stores (name, address, city, state, zip, phone, website, lat, lng) VALUES
  ('Military Surplus Store', '123 Main St', 'Fayetteville', 'NC', '28301', '910-555-0100', 'https://example.com', 35.0527, -78.8784),
  ('Army Navy Store', '456 Veterans Blvd', 'Jacksonville', 'NC', '28540', '910-555-0200', 'https://example.com', 34.7540, -77.4302),
  ('Patriot Outfitters', '789 Liberty Ave', 'Norfolk', 'VA', '23510', '757-555-0300', 'https://example.com', 36.8508, -76.2859);

-- Sample Prices
INSERT INTO prices (item_id, store_id, price, in_stock) VALUES
  (1, 1, 12.99, 1),
  (1, 2, 14.99, 1),
  (2, 1, 8.99, 1),
  (3, 1, 15.99, 1),
  (3, 2, 12.99, 0),
  (4, 1, 19.99, 1),
  (6, 3, 89.99, 1);

-- Sample Votes
INSERT INTO votes (price_id, vote_type, voter_ip) VALUES
  (1, 'up', '192.168.1.1'),
  (1, 'up', '192.168.1.2'),
  (2, 'down', '192.168.1.3'),
  (3, 'up', '192.168.1.1');
-- Add Items for Ranger School
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
-- Full Production Seed Generated from Research

-- 1. Master Item List
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Rhino Mount & J-Arm', 'Night vision mount for helmet', 'Tools and Equipment', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Multi-tool', 'Leatherman or Gerber', 'Tools and Equipment', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Sunscreen', 'Non-aerosol, 6-8 oz bottle', 'Hygiene and Medical', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Bite Valve & Bladder', 'Spare hydration parts', 'Field Gear', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('OCP Uniform Set', 'Top and Bottom', 'Uniforms and Clothing', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Tan T-Shirt', 'Standard Issue Tan 499', 'Uniforms and Clothing', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Patrol Cap', 'OCP Pattern', 'Uniforms and Clothing', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('PT Uniform Set', 'APFU Shorts/Shirt', 'Uniforms and Clothing', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Running Shoes', 'Athletic shoes', 'Footwear', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Boots (Hot Weather)', 'Tan/Coyote AR 670-1', 'Footwear', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('ID Tags', 'Dog tags with chain', 'Administrative', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Combination Lock', 'Master Lock style', 'Security', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Duffel Bag', 'Green/Black Issue', 'Field Gear', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Headlamp (Red/White)', 'AA/AAA Battery', 'Tools and Equipment', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Wristwatch', 'Basic non-GPS', 'Tools and Equipment', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Baby Wipes', 'Unscented', 'Hygiene and Medical', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Boots (CAAS)', 'AR 670-1 Compliant', 'Footwear', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Gloves (Leather Palm)', 'Work/Tactical', 'Uniforms and Clothing', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Rubber Duck', 'M16 Replica', 'Training Aid', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('1QT Canteen', 'Plastic', 'Field Gear', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Wet Weather Bag', 'Waterproof liner', 'Field Gear', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Jump Log', 'DA Form 1307', 'Administrative', 'N/A');
INSERT OR IGNORE INTO items (name, description, category, asin) VALUES ('Red Pen', 'Ink pen', 'Administrative', 'N/A');

-- 2. Packing Lists and Item Links

-- Army Ranger School

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Army Ranger School Packing List 2025', 'Premier leadership and small unit tactics course. v.11 (Sept 2025) update.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'MOORE'), 'Admin'
FROM schools WHERE abbreviation = 'Ranger';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'New requirement v.11', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Rhino Mount & J-Arm';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Required v.11', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Multi-tool';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Required v.11', 'Hygiene', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Sunscreen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Extra set required', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Bite Valve & Bladder';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'No unit logos', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Sewn rank', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'Army Issue', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Good condition', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No civilian boots', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Long/Short chain', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No key locks', 'Security', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Everything must fit', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Red lens mandatory', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'No GPS allowed', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Hygiene', 'Hygiene', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Baby Wipes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'With cup', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = '1QT Canteen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Rubberized', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Wet Weather Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'For exams', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Red Pen';


-- Army Airborne School

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Army Airborne School Packing List 2025', 'Basic paratrooper training (Jump School). 2024-2025 update.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'MOORE'), 'Admin'
FROM schools WHERE abbreviation = 'Airborne';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'No unit logos', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Sewn rank', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'Army Issue', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Good condition', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No civilian boots', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Long/Short chain', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No key locks', 'Security', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Combination Lock';


-- Special Forces Assessment and Selection

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Special Forces Assessment and Selection Packing List 2025', 'Special Forces candidate assessment. 2024-2025 strict sterile gear list.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'LIBERTY'), 'Admin'
FROM schools WHERE abbreviation = 'SFAS';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Required v.11', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Multi-tool';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Required v.11', 'Hygiene', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Sunscreen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Extra set required', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Bite Valve & Bladder';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'No unit logos', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Sewn rank', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'Army Issue', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Good condition', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No civilian boots', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Long/Short chain', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No key locks', 'Security', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Everything must fit', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Red lens mandatory', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'No GPS allowed', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Hygiene', 'Hygiene', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Baby Wipes';


-- Psychological Operations Assessment and Selection

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Psychological Operations Assessment and Selection Packing List 2025', 'PSYOP candidate assessment and selection.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'LIBERTY'), 'Admin'
FROM schools WHERE abbreviation = 'POAS';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'No unit logos', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Sewn rank', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'Army Issue', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Good condition', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No civilian boots', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Long/Short chain', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No key locks', 'Security', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Everything must fit', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Red lens mandatory', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'No GPS allowed', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Wristwatch';


-- Civil Affairs Assessment and Selection

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Civil Affairs Assessment and Selection Packing List 2025', 'CA candidate assessment and selection.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'LIBERTY'), 'Admin'
FROM schools WHERE abbreviation = 'CAAS';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'No unit logos', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Sewn rank', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'Army Issue', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Good condition', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No civilian boots', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Long/Short chain', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No key locks', 'Security', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Everything must fit', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Red lens mandatory', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'No GPS allowed', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, '4 pairs required', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Boots (CAAS)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 8, 'Heavy usage', 'Clothing', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Gloves (Leather Palm)';


-- Small Unit Tactics (Q-Course Phase)

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Small Unit Tactics (Q-Course Phase) Packing List 2025', 'Tactical field operations phase of SF Qualification Course.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'LIBERTY'), 'Admin'
FROM schools WHERE abbreviation = 'SUT';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'No unit logos', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Sewn rank', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'Army Issue', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Good condition', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No civilian boots', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Long/Short chain', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No key locks', 'Security', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Everything must fit', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Red lens mandatory', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'No GPS allowed', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Hygiene', 'Hygiene', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Baby Wipes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'With cup', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = '1QT Canteen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Rubberized', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Wet Weather Bag';


-- Air Assault School

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Air Assault School Packing List 2025', 'Helicopter operations and rappelling course. Lightning Academy/TSAAS 2024 list.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'CAMPBELL'), 'Admin'
FROM schools WHERE abbreviation = 'Air Assault';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Required v.11', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Multi-tool';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'No unit logos', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Sewn rank', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Good condition', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No civilian boots', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Long/Short chain', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Red lens mandatory', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Issued item', 'Training', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Rubber Duck';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'With cup', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = '1QT Canteen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Rubberized', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Wet Weather Bag';


-- Jumpmaster School

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Jumpmaster School Packing List 2025', 'Advanced paratrooper leadership and safety course. July 2023 update.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'MOORE'), 'Admin'
FROM schools WHERE abbreviation = 'Jumpmaster';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'No unit logos', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Sewn rank', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'Army Issue', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Good condition', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No civilian boots', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Long/Short chain', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No key locks', 'Security', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Proof of jumps', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Jump Log';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'For exams', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Red Pen';


-- SERE School (Level C)

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'SERE School (Level C) Packing List 2025', 'Survival, Evasion, Resistance, and Escape. High risk of capture training.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'LIBERTY'), 'Admin'
FROM schools WHERE abbreviation = 'SERE';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Required v.11', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Multi-tool';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Required v.11', 'Hygiene', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Sunscreen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 5, 'No unit logos', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Sewn rank', 'Uniforms', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Good condition', 'PT Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'No civilian boots', 'Footwear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Long/Short chain', 'Admin', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Everything must fit', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 2, 'Red lens mandatory', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'No GPS allowed', 'Equipment', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'With cup', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = '1QT Canteen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes, section, required)
SELECT pl.id, i.id, 1, 'Rubberized', 'Field Gear', 1
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Wet Weather Bag';

