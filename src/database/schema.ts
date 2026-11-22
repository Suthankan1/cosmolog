export const CREATE_TABLES_SQL = `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS cached_items (
    local_id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    published_at TEXT,
    image_remote_url TEXT,
    image_local_uri TEXT,
    canonical_url TEXT,
    attribution TEXT,
    author TEXT,
    media_type TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(source, external_id)
  );

  CREATE TABLE IF NOT EXISTS favourites (
    local_id TEXT PRIMARY KEY,
    added_at TEXT NOT NULL,
    FOREIGN KEY (local_id) REFERENCES cached_items(local_id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sync_metadata (
    feed_key TEXT PRIMARY KEY,
    last_synced_at TEXT,
    last_attempt_at TEXT,
    last_error_code TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_cached_items_source ON cached_items(source);
  CREATE INDEX IF NOT EXISTS idx_cached_items_published_at ON cached_items(published_at DESC);
  CREATE INDEX IF NOT EXISTS idx_favourites_added_at ON favourites(added_at DESC);
`;
