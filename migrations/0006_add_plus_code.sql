-- Add Plus Code (Open Location Code) column
ALTER TABLE buildings ADD COLUMN plus_code TEXT;
CREATE INDEX idx_buildings_plus_code ON buildings(plus_code) WHERE plus_code IS NOT NULL;
