// Shared SQLite schema: used by server/db.js (node:sqlite) and static/shims/db.js (sql.js in the browser).
module.exports = `
CREATE TABLE IF NOT EXISTS user_fortune_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  calendar_type TEXT NOT NULL DEFAULT 'solar',
  birth_year INTEGER NOT NULL,
  birth_month INTEGER NOT NULL,
  birth_day INTEGER NOT NULL,
  birth_hour INTEGER NOT NULL,
  birth_minute INTEGER DEFAULT 0,
  is_leap_month INTEGER NOT NULL DEFAULT 0,
  gender TEXT NOT NULL DEFAULT 'M',
  city TEXT DEFAULT 'Taipei',
  latitude REAL DEFAULT 25.0330,
  longitude REAL DEFAULT 121.5654,
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_fortune_profiles_user ON user_fortune_profiles(user_id);

CREATE TABLE IF NOT EXISTS fortune_oracle_records (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  collection_id TEXT NOT NULL DEFAULT 'mazu_60_jiazi',
  edition_version TEXT NOT NULL DEFAULT '1.0.0',
  lot_number INTEGER NOT NULL,
  gan_zhi TEXT NOT NULL,
  gua_rank TEXT,
  topic TEXT NOT NULL DEFAULT 'general',
  question TEXT DEFAULT '',
  poem_lines TEXT NOT NULL,
  story_title TEXT DEFAULT '',
  story_summary TEXT DEFAULT '',
  explanation_summary TEXT DEFAULT '',
  topic_advice TEXT DEFAULT '',
  user_notes TEXT DEFAULT '',
  verified_status TEXT DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now', 'localtime'))
);
CREATE INDEX IF NOT EXISTS idx_fortune_records_user ON fortune_oracle_records(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fortune_records_topic ON fortune_oracle_records(topic);
CREATE INDEX IF NOT EXISTS idx_fortune_records_status ON fortune_oracle_records(verified_status);
`;
