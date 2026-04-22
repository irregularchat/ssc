-- Add packing lists for schools
-- Safe to run multiple times (checks for existing lists)

-- Ranger School Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'Ranger School Essentials',
       'Complete packing list for the 62-day Ranger School course. Source: Airborne and Ranger Training Brigade (ARTB)',
       'Advanced Training',
       1,
       id,
       'ARTB Guidelines'
FROM schools WHERE abbreviation = 'Ranger'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'Ranger'));

-- Airborne School Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'Airborne School Essentials',
       '3-week Basic Airborne Course packing list. Source: ARTB',
       'Advanced Training',
       1,
       id,
       'ARTB Guidelines'
FROM schools WHERE abbreviation = 'Airborne'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'Airborne'));

-- Air Assault School Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'Air Assault School Essentials',
       '10-day Sabalauski Air Assault School packing list. Source: 101st Airborne Division',
       'Advanced Training',
       1,
       id,
       '101st ABN Guidelines'
FROM schools WHERE abbreviation = 'Air Assault'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'Air Assault'));

-- SFAS Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'SFAS Packing List',
       '24-day Special Forces Assessment and Selection packing list. Source: SORB',
       'Selection',
       1,
       id,
       'SORB Guidelines'
FROM schools WHERE abbreviation = 'SFAS'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'SFAS'));

-- Jumpmaster School Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'Jumpmaster School Essentials',
       'Advanced paratrooper leadership course packing list. Source: ARTB',
       'Advanced Training',
       1,
       id,
       'ARTB Guidelines'
FROM schools WHERE abbreviation = 'Jumpmaster'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'Jumpmaster'));

-- Marine Corps Recruit Depot Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'Marine Boot Camp Essentials',
       '13-week Marine Corps Recruit Training packing list',
       'Basic Training',
       1,
       id,
       'Anonymous Marine'
FROM schools WHERE abbreviation = 'MCRD'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'MCRD'));

-- Air Force BMT Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'Air Force BMT Essentials',
       '7.5-week Air Force Basic Military Training packing list',
       'Basic Training',
       1,
       id,
       'Anonymous Airman'
FROM schools WHERE abbreviation = 'BMT'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'BMT'));

-- Navy RTC Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'Navy Boot Camp Essentials',
       '10-week Navy Recruit Training Command packing list',
       'Basic Training',
       1,
       id,
       'Anonymous Sailor'
FROM schools WHERE abbreviation = 'RTC'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'RTC'));

-- POAS Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'POAS Packing List',
       'Psychological Operations Assessment and Selection packing list. Source: SORB',
       'Selection',
       1,
       id,
       'SORB Guidelines'
FROM schools WHERE abbreviation = 'POAS'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'POAS'));

-- CAAS Packing List
INSERT INTO packing_lists (name, description, type, is_public, school_id, contributor_name)
SELECT 'CAAS Packing List',
       'Civil Affairs Assessment and Selection packing list. Source: SORB',
       'Selection',
       1,
       id,
       'SORB Guidelines'
FROM schools WHERE abbreviation = 'CAAS'
AND NOT EXISTS (SELECT 1 FROM packing_lists WHERE school_id = (SELECT id FROM schools WHERE abbreviation = 'CAAS'));
