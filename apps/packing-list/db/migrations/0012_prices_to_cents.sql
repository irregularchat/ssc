-- Convert dollar prices to cents (integer storage)
-- Existing data has mixed formats:
--   Seed data: dollars (8.99, 12.99, etc.)
--   User submissions: already cents (1200)
-- We identify dollar values as those < 1000 (no item costs $10+)
-- and convert them to cents. Values >= 1000 are assumed already cents.

UPDATE prices SET price = ROUND(price * 100) WHERE price < 1000;

-- Note: Column type stays REAL in SQLite (no ALTER COLUMN).
-- Application code will treat all values as integer cents going forward.
