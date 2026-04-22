-- Life Pro Tips: community advice tied to packing lists
CREATE TABLE IF NOT EXISTS tips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  packing_list_id INTEGER NOT NULL,
  item_id INTEGER,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  compliance_status TEXT NOT NULL DEFAULT 'allowed',
  contributor_name TEXT,
  approved INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (packing_list_id) REFERENCES packing_lists(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS tip_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tip_id INTEGER NOT NULL,
  vote_type TEXT NOT NULL CHECK(vote_type IN ('up', 'down')),
  voter_ip TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tip_id) REFERENCES tips(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tips_packing_list_id ON tips(packing_list_id);
CREATE INDEX IF NOT EXISTS idx_tips_item_id ON tips(item_id);
CREATE INDEX IF NOT EXISTS idx_tips_approved ON tips(approved);
CREATE INDEX IF NOT EXISTS idx_tip_votes_tip_id ON tip_votes(tip_id);
