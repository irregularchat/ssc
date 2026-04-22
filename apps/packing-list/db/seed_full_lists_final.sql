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
SELECT 'Army Ranger School Packing List 2025', 'Premier leadership and small unit tactics course. v.11 (Sept 2025) update.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'Benning'), 'Admin'
FROM schools WHERE abbreviation = 'Ranger';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'New requirement v.11 (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Rhino Mount & J-Arm';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Required v.11 (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Multi-tool';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Required v.11 (Hygiene)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Sunscreen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Extra set required (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Bite Valve & Bladder';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'No unit logos (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Sewn rank (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'Army Issue (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Good condition (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No civilian boots (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Long/Short chain (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No key locks (Security)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Everything must fit (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Red lens mandatory (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'No GPS allowed (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Hygiene (Hygiene)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Baby Wipes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'With cup (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = '1QT Canteen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Rubberized (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Wet Weather Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'For exams (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Ranger School Packing List 2025' AND i.name = 'Red Pen';


-- Army Airborne School

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Army Airborne School Packing List 2025', 'Basic paratrooper training (Jump School). 2024-2025 update.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'Benning'), 'Admin'
FROM schools WHERE abbreviation = 'Airborne';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'No unit logos (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Sewn rank (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'Army Issue (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Good condition (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No civilian boots (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Long/Short chain (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No key locks (Security)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Army Airborne School Packing List 2025' AND i.name = 'Combination Lock';


-- Special Forces Assessment and Selection

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Special Forces Assessment and Selection Packing List 2025', 'Special Forces candidate assessment. 2024-2025 strict sterile gear list.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'Bragg'), 'Admin'
FROM schools WHERE abbreviation = 'SFAS';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Required v.11 (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Multi-tool';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Required v.11 (Hygiene)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Sunscreen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Extra set required (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Bite Valve & Bladder';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'No unit logos (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Sewn rank (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'Army Issue (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Good condition (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No civilian boots (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Long/Short chain (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No key locks (Security)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Everything must fit (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Red lens mandatory (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'No GPS allowed (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Hygiene (Hygiene)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Special Forces Assessment and Selection Packing List 2025' AND i.name = 'Baby Wipes';


-- Psychological Operations Assessment and Selection

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Psychological Operations Assessment and Selection Packing List 2025', 'PSYOP candidate assessment and selection.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'Bragg'), 'Admin'
FROM schools WHERE abbreviation = 'POAS';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'No unit logos (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Sewn rank (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'Army Issue (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Good condition (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No civilian boots (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Long/Short chain (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No key locks (Security)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Everything must fit (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Red lens mandatory (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'No GPS allowed (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Psychological Operations Assessment and Selection Packing List 2025' AND i.name = 'Wristwatch';


-- Civil Affairs Assessment and Selection

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Civil Affairs Assessment and Selection Packing List 2025', 'CA candidate assessment and selection.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'Bragg'), 'Admin'
FROM schools WHERE abbreviation = 'CAAS';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'No unit logos (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Sewn rank (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'Army Issue (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Good condition (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No civilian boots (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Long/Short chain (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No key locks (Security)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Everything must fit (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Red lens mandatory (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'No GPS allowed (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, '4 pairs required (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Boots (CAAS)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 8, 'Heavy usage (Clothing)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Civil Affairs Assessment and Selection Packing List 2025' AND i.name = 'Gloves (Leather Palm)';


-- Small Unit Tactics (Q-Course Phase)

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Small Unit Tactics (Q-Course Phase) Packing List 2025', 'Tactical field operations phase of SF Qualification Course.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'Bragg'), 'Admin'
FROM schools WHERE abbreviation = 'SUT';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'No unit logos (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Sewn rank (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'Army Issue (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Good condition (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No civilian boots (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Long/Short chain (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No key locks (Security)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Everything must fit (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Red lens mandatory (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'No GPS allowed (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Hygiene (Hygiene)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Baby Wipes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'With cup (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = '1QT Canteen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Rubberized (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Small Unit Tactics (Q-Course Phase) Packing List 2025' AND i.name = 'Wet Weather Bag';


-- Air Assault School

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Air Assault School Packing List 2025', 'Helicopter operations and rappelling course. Lightning Academy/TSAAS 2024 list.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'Campbell'), 'Admin'
FROM schools WHERE abbreviation = 'Air Assault';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Required v.11 (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Multi-tool';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'No unit logos (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Sewn rank (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Good condition (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No civilian boots (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Long/Short chain (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Red lens mandatory (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Issued item (Training)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Rubber Duck';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'With cup (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = '1QT Canteen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Rubberized (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Air Assault School Packing List 2025' AND i.name = 'Wet Weather Bag';


-- Jumpmaster School

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'Jumpmaster School Packing List 2025', 'Advanced paratrooper leadership and safety course. July 2023 update.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'Benning'), 'Admin'
FROM schools WHERE abbreviation = 'Jumpmaster';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'No unit logos (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Sewn rank (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'Army Issue (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'PT Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Good condition (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No civilian boots (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Long/Short chain (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No key locks (Security)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Combination Lock';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Proof of jumps (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Jump Log';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'For exams (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'Jumpmaster School Packing List 2025' AND i.name = 'Red Pen';


-- SERE School (Level C)

INSERT OR IGNORE INTO packing_lists (name, description, type, is_public, school_id, base_id, contributor_name)
SELECT 'SERE School (Level C) Packing List 2025', 'Survival, Evasion, Resistance, and Escape. High risk of capture training.', 'course', 1, id, (SELECT id FROM bases WHERE abbreviation = 'Bragg'), 'Admin'
FROM schools WHERE abbreviation = 'SERE';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Required v.11 (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Multi-tool';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Required v.11 (Hygiene)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Sunscreen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 4, 'Sewn rank/nametapes (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'OCP Uniform Set';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 5, 'No unit logos (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Tan T-Shirt';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Sewn rank (Uniforms)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Patrol Cap';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Good condition (PT Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Running Shoes';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'No civilian boots (Footwear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Boots (Hot Weather)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Long/Short chain (Admin)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'ID Tags';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Everything must fit (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Duffel Bag';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 2, 'Red lens mandatory (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Headlamp (Red/White)';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'No GPS allowed (Equipment)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Wristwatch';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'With cup (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = '1QT Canteen';


INSERT OR IGNORE INTO packing_list_items (packing_list_id, item_id, quantity, notes)
SELECT pl.id, i.id, 1, 'Rubberized (Field Gear)'
FROM packing_lists pl, items i 
WHERE pl.name = 'SERE School (Level C) Packing List 2025' AND i.name = 'Wet Weather Bag';

