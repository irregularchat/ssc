-- Add what3words address column for precise 3m x 3m location sharing
ALTER TABLE buildings ADD COLUMN w3w_address TEXT;

-- Index for lookups by w3w address (e.g., searching by ///word.word.word)
CREATE INDEX idx_buildings_w3w ON buildings(w3w_address) WHERE w3w_address IS NOT NULL;
