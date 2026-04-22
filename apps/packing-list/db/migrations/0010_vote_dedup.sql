-- Add unique constraint to prevent duplicate votes per IP
-- For price votes
CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_unique_ip ON votes(price_id, voter_ip);

-- For tip votes
CREATE UNIQUE INDEX IF NOT EXISTS idx_tip_votes_unique_ip ON tip_votes(tip_id, voter_ip);
