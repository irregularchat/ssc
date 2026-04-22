# Database Operations Guide

This guide covers how to programmatically update the Community Packing List database using Cloudflare D1.

## Quick Reference

```bash
# Database name: cpl-db
# All commands run from: frontend-react/apps/web/

# Execute SQL file
npx wrangler d1 execute cpl-db --remote --file=path/to/file.sql

# Execute single command
npx wrangler d1 execute cpl-db --remote --command="SELECT * FROM stores LIMIT 5;"

# Local development (no --remote flag)
npx wrangler d1 execute cpl-db --file=path/to/file.sql
```

---

## Database Schema

### Bases (Military Installations)

```sql
CREATE TABLE bases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- "Fort Liberty"
  abbreviation TEXT,            -- "Liberty"
  branch TEXT,                  -- "Army", "Navy", "Marines", "Air Force"
  location TEXT,                -- "Fayetteville, NC"
  state TEXT,                   -- "NC"
  region TEXT,                  -- "CONUS" or "OCONUS"
  website TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Schools (Training Programs)

```sql
CREATE TABLE schools (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- "Army Basic Combat Training"
  abbreviation TEXT,            -- "BCT"
  branch TEXT,                  -- "Army"
  location TEXT,                -- Deprecated, use school_bases
  website TEXT,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Schools can have multiple training locations
CREATE TABLE school_bases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id INTEGER NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  base_id INTEGER NOT NULL REFERENCES bases(id) ON DELETE CASCADE,
  is_primary INTEGER DEFAULT 0,  -- 1 if this is the primary location
  notes TEXT,                    -- Location-specific notes
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(school_id, base_id)
);
```

### Items (Packing List Items)

```sql
CREATE TABLE items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- "Black Boot Socks"
  description TEXT,
  category TEXT,                -- "Clothing", "Footwear", "Personal Care"
  asin TEXT,                    -- Amazon ASIN for linking
  image_url TEXT,
  unit_name TEXT DEFAULT 'each', -- "pair", "pack", "each"
  weight_oz REAL,               -- Weight in ounces
  brand_preference TEXT,        -- Recommended brand
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Stores

```sql
CREATE TABLE stores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- "Walmart Supercenter"
  store_type TEXT,              -- "PX", "Commissary", "Walmart", "Target", "Military Surplus"
  is_online INTEGER DEFAULT 0,  -- 1 for online stores
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  website TEXT,
  lat REAL,                     -- Latitude
  lng REAL,                     -- Longitude
  base_id INTEGER REFERENCES bases(id),  -- Nearby base
  accepts_military_discount INTEGER DEFAULT 0,
  military_discount_pct INTEGER, -- e.g., 10 for 10%
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

### Prices

```sql
CREATE TABLE prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL REFERENCES items(id),
  store_id INTEGER NOT NULL REFERENCES stores(id),
  price INTEGER NOT NULL,       -- Price in CENTS (e.g., 1999 = $19.99)
  package_qty INTEGER DEFAULT 1, -- Units per package
  package_name TEXT,            -- "6-pack", "3-pair bundle"
  price_type TEXT DEFAULT 'regular', -- "regular", "sale", "military"
  military_discount_pct INTEGER,
  in_stock INTEGER DEFAULT 1,
  source TEXT,                  -- "in_store", "online", "user_report"
  reported_by TEXT,             -- Who reported this price
  date_recorded TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now'))
);
```

---

## Common Operations

### Adding Bases

```sql
-- Single base
INSERT INTO bases (name, abbreviation, branch, state, region, location) VALUES
('Fort Moore', 'Moore', 'Army', 'GA', 'CONUS', 'Columbus, GA');

-- Multiple bases
INSERT INTO bases (name, abbreviation, branch, state, region, location) VALUES
('Fort Novosel', 'Novosel', 'Army', 'AL', 'CONUS', 'Daleville, AL'),
('Fort Eisenhower', 'Eisenhower', 'Army', 'GA', 'CONUS', 'Augusta, GA'),
('Joint Base Lewis-McChord', 'JBLM', 'Joint', 'WA', 'CONUS', 'Tacoma, WA');
```

### Adding Schools

```sql
-- Add a school
INSERT INTO schools (name, abbreviation, branch, description) VALUES
('Army Ranger School', 'Ranger', 'Army', 'Premier leadership and small unit tactics course. v.11 (Sept 2025) update.'),
('Army Airborne School', 'Airborne', 'Army', 'Basic paratrooper training (Jump School). 2024-2025 update.'),
('Special Forces Assessment and Selection', 'SFAS', 'Army', 'Special Forces candidate assessment. 2024-2025 strict sterile gear list.'),
('Psychological Operations Assessment and Selection', 'POAS', 'Army', 'PSYOP candidate assessment and selection.'),
('Civil Affairs Assessment and Selection', 'CAAS', 'Army', 'CA candidate assessment and selection.'),
('Small Unit Tactics (Q-Course Phase)', 'SUT', 'Army', 'Tactical field operations phase of SF Qualification Course.'),
('Air Assault School', 'Air Assault', 'Army', 'Helicopter operations and rappelling course. Lightning Academy/TSAAS 2024 list.'),
('Jumpmaster School', 'Jumpmaster', 'Army', 'Advanced paratrooper leadership and safety course. July 2023 update.');

-- Link school to training locations
INSERT INTO school_bases (school_id, base_id, is_primary, notes)
SELECT
  (SELECT id FROM schools WHERE abbreviation = 'BCT'),
  id,
  CASE WHEN abbreviation = 'Jackson' THEN 1 ELSE 0 END,
  CASE
    WHEN abbreviation = 'Jackson' THEN 'Primary BCT location'
    WHEN abbreviation = 'Benning' THEN 'Infantry and Armor OSUT'
    WHEN abbreviation = 'Sill' THEN 'Field Artillery BCT'
    WHEN abbreviation = 'Leonard Wood' THEN 'Chemical, MP, Engineer BCT'
  END
FROM bases
WHERE abbreviation IN ('Jackson', 'Benning', 'Sill', 'Leonard Wood');

-- Link Ranger School to Fort Moore
INSERT INTO school_bases (school_id, base_id, is_primary)
SELECT
  (SELECT id FROM schools WHERE abbreviation = 'Ranger'),
  id,
  1
FROM bases WHERE abbreviation = 'Benning' OR name = 'Fort Moore';
```

### Adding Items

```sql
-- Single item
INSERT INTO items (name, category, description, unit_name) VALUES
('Black Crew Socks', 'Clothing', 'Plain black crew socks, no logos', 'pair');

-- Multiple items
INSERT INTO items (name, category, description, unit_name, brand_preference) VALUES
('Running Shoes', 'Footwear', 'Neutral running shoes', 'pair', 'ASICS, Brooks, or New Balance'),
('White Crew T-Shirts', 'Clothing', 'Plain white, no logos or pockets', 'each', NULL),
('Combination Lock', 'Security', 'Standard combination padlock', 'each', 'Master Lock'),
('Toiletry Bag', 'Personal Care', 'Clear or mesh toiletry bag', 'each', NULL);
```

### Adding Stores

```sql
-- Online store (no base_id needed)
INSERT INTO stores (name, store_type, is_online, website, accepts_military_discount, military_discount_pct) VALUES
('Tactical Distributors', 'Military Surplus', 1, 'https://tacticaldistributors.com', 1, 10);

-- Local store near a base
INSERT INTO stores (name, store_type, is_online, address, city, state, zip, base_id, accepts_military_discount)
SELECT
  'Academy Sports',
  'Sporting Goods',
  0,
  '123 Main St',
  'Fayetteville',
  'NC',
  '28301',
  id,
  1
FROM bases WHERE abbreviation = 'Liberty';
```

### Adding Prices

**Important: Prices are stored in CENTS!** $19.99 = 1999

```sql
-- Add a price
INSERT INTO prices (item_id, store_id, price, source, reported_by) VALUES
(1, 1, 1299, 'in_store', 'Admin');  -- $12.99

-- Add price with package info
INSERT INTO prices (item_id, store_id, price, package_qty, package_name, source, reported_by) VALUES
(1, 2, 1999, 6, '6-pack', 'online', 'Admin');  -- $19.99 for 6-pack

-- Bulk price import using item/store names
INSERT INTO prices (item_id, store_id, price, source, reported_by)
SELECT
  i.id,
  s.id,
  999,  -- $9.99
  'import',
  'Admin'
FROM items i, stores s
WHERE i.name = 'Black Crew Socks'
  AND s.name = 'Amazon';
```

---

## Bulk Import via CSV

### Using the Admin UI

1. Go to `/admin/import-export`
2. Download the template CSV
3. Fill in your data
4. Upload and import

### CSV Format: Items

```csv
name,description,category,asin,image_url
Black Boot Socks,Cushioned boot socks,Clothing,B07ABC123,
Running Shoes,Neutral cushion shoes,Footwear,B08XYZ789,
```

### CSV Format: Stores

```csv
name,store_type,address,city,state,zip,phone,website,base_id
Main PX,PX,Building 100,Fort Liberty,NC,28310,910-555-1234,https://shopmyexchange.com,1
```

### CSV Format: Prices

```csv
item_id,store_id,price,source,reported_by
1,1,1299,import,Admin
2,1,4999,import,Admin
3,2,899,import,Admin
```

---

## Querying Data

### View all stores near a base

```sql
SELECT s.*, b.name as base_name
FROM stores s
LEFT JOIN bases b ON s.base_id = b.id
WHERE b.abbreviation = 'Liberty'
ORDER BY s.store_type;
```

### View all prices for an item

```sql
SELECT
  p.price / 100.0 as price_dollars,
  p.package_qty,
  s.name as store_name,
  s.store_type,
  s.is_online
FROM prices p
JOIN stores s ON p.store_id = s.id
WHERE p.item_id = (SELECT id FROM items WHERE name LIKE '%Boot Sock%')
ORDER BY p.price / p.package_qty ASC;
```

### Find items without prices

```sql
SELECT i.id, i.name, i.category
FROM items i
LEFT JOIN prices p ON i.id = p.item_id
WHERE p.id IS NULL
ORDER BY i.name;
```

### Get school training locations

```sql
SELECT
  s.name as school,
  b.name as base,
  b.state,
  sb.is_primary,
  sb.notes
FROM school_bases sb
JOIN schools s ON sb.school_id = s.id
JOIN bases b ON sb.base_id = b.id
WHERE s.abbreviation = 'BCT'
ORDER BY sb.is_primary DESC, b.name;
```

---

## Update Operations

### Update a store

```sql
UPDATE stores
SET
  accepts_military_discount = 1,
  military_discount_pct = 15,
  updated_at = datetime('now')
WHERE name = 'Academy Sports';
```

### Update a price

```sql
UPDATE prices
SET
  price = 1499,  -- $14.99
  date_recorded = datetime('now')
WHERE item_id = 1 AND store_id = 1;
```

### Rename a base (e.g., Fort Bragg → Fort Liberty)

```sql
UPDATE bases
SET
  name = 'Fort Liberty',
  abbreviation = 'Liberty',
  updated_at = datetime('now')
WHERE name = 'Fort Bragg';
```

---

## Delete Operations

**Use with caution! Consider soft-deletes or archiving instead.**

```sql
-- Delete a price
DELETE FROM prices WHERE id = 123;

-- Delete an item (will fail if prices exist due to FK)
DELETE FROM items WHERE id = 456;

-- Delete store and its prices (cascading)
DELETE FROM prices WHERE store_id = (SELECT id FROM stores WHERE name = 'Old Store');
DELETE FROM stores WHERE name = 'Old Store';
```

---

## Migrations

Create new migration files in `db/migrations/` with sequential numbering:

```
0001_initial.sql
0002_stores_by_installation.sql
0003_fix_base_names_2025.sql
0004_packaging_units.sql
0005_additional_columns.sql
0006_school_locations_and_list_inheritance.sql
0007_your_new_migration.sql  <-- New
```

Run migrations:
```bash
npx wrangler d1 execute cpl-db --remote --file=db/migrations/0007_your_new_migration.sql
```

---

## Scripting Examples

### Bash: Import items from file

```bash
#!/bin/bash
# import-items.sh

while IFS=, read -r name category description; do
  npx wrangler d1 execute cpl-db --remote --command="
    INSERT INTO items (name, category, description)
    VALUES ('$name', '$category', '$description');
  "
done < items.csv
```

### Node.js: Fetch and update prices

```javascript
// fetch-prices.js
import { execSync } from 'child_process';

const items = JSON.parse(
  execSync('npx wrangler d1 execute cpl-db --remote --command="SELECT id, asin FROM items WHERE asin IS NOT NULL" --json').toString()
);

for (const item of items) {
  // Fetch price from API...
  const price = await fetchPriceFromAPI(item.asin);

  execSync(`npx wrangler d1 execute cpl-db --remote --command="
    INSERT INTO prices (item_id, store_id, price, source)
    VALUES (${item.id}, 1, ${Math.round(price * 100)}, 'api')
  "`);
}
```

---

## Best Practices

1. **Always use --remote for production** - Without it, you're modifying local dev DB
2. **Prices in cents** - Store as integers to avoid floating point issues
3. **Use transactions for bulk ops** - Wrap multiple inserts in BEGIN/COMMIT
4. **Test locally first** - Run without --remote to test on local DB
5. **Back up before major changes** - Export data via admin UI first
6. **Use the admin UI** - For single records, the web UI is easier than SQL

---

## Useful Commands

```bash
# List all tables
npx wrangler d1 execute cpl-db --remote --command="SELECT name FROM sqlite_master WHERE type='table';"

# Count records in each table
npx wrangler d1 execute cpl-db --remote --command="
  SELECT 'bases' as tbl, COUNT(*) as cnt FROM bases
  UNION SELECT 'schools', COUNT(*) FROM schools
  UNION SELECT 'items', COUNT(*) FROM items
  UNION SELECT 'stores', COUNT(*) FROM stores
  UNION SELECT 'prices', COUNT(*) FROM prices;
"

# Export table to JSON
npx wrangler d1 execute cpl-db --remote --command="SELECT * FROM items" --json > items.json

# Show table schema
npx wrangler d1 execute cpl-db --remote --command="PRAGMA table_info(stores);"
```
