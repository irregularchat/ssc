-- Add MGRS (Military Grid Reference System) column
ALTER TABLE buildings ADD COLUMN mgrs TEXT;
CREATE INDEX idx_buildings_mgrs ON buildings(mgrs) WHERE mgrs IS NOT NULL;
