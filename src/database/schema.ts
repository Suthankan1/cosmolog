export const CREATE_TABLES_SQL = `

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

export const MIGRATE_TO_SNAPSHOTS_SQL = `
  ALTER TABLE favourites RENAME TO legacy_favourites;
  CREATE TABLE favourites (
    account_id INTEGER NOT NULL CHECK (account_id >= 0),
    local_id TEXT NOT NULL REFERENCES cached_items(local_id) ON DELETE CASCADE,
    added_at TEXT NOT NULL,
    PRIMARY KEY (account_id, local_id)
  );

  INSERT INTO favourites (account_id, local_id, added_at)
    SELECT 0, f.local_id, f.added_at FROM legacy_favourites f
    JOIN cached_items c ON c.local_id = f.local_id;
  DROP TABLE legacy_favourites;
  CREATE INDEX idx_favourites_local_id ON favourites(local_id);
  CREATE INDEX idx_favourites_account_added ON favourites(account_id, added_at DESC);

  CREATE TABLE feed_membership (
    source TEXT NOT NULL,
    local_id TEXT NOT NULL REFERENCES cached_items(local_id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    PRIMARY KEY (source, local_id)
  );
  CREATE INDEX idx_feed_membership_local_id ON feed_membership(local_id);

  -- The old schema kept one unbounded list. Preserve existing content until its source refreshes.
  INSERT INTO feed_membership (source, local_id, position)
    SELECT source, local_id, ROW_NUMBER() OVER (
      PARTITION BY source ORDER BY published_at DESC, fetched_at DESC, local_id
    ) FROM cached_items;

  CREATE TABLE saved_media (
    local_id TEXT PRIMARY KEY REFERENCES cached_items(local_id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('waiting', 'ready', 'failed')),
    file_name TEXT,
    bytes INTEGER NOT NULL DEFAULT 0,
    CHECK (status != 'ready' OR file_name IS NOT NULL)
  );
  INSERT INTO saved_media (local_id, status, file_name)
    SELECT c.local_id, 'ready',
      substr(c.image_local_uri, instr(c.image_local_uri, '/cosmolog_images/') + length('/cosmolog_images/'))
    FROM cached_items c
    WHERE c.image_local_uri LIKE '%/cosmolog_images/%'
    AND EXISTS (SELECT 1 FROM favourites WHERE local_id = c.local_id);

  PRAGMA user_version = 1;
`;

export const MIGRATE_TO_NOTES_SQL = `
  ALTER TABLE favourites ADD COLUMN note TEXT;
  PRAGMA user_version = 2;
`;

export const MIGRATE_TO_IMAGE_LICENSES_SQL = `
  ALTER TABLE cached_items ADD COLUMN image_license_url TEXT;
  PRAGMA user_version = 3;
`;

export const MIGRATE_TO_MEDIA_PROVENANCE_SQL = `
  ALTER TABLE saved_media ADD COLUMN source_url TEXT;
  ALTER TABLE saved_media ADD COLUMN license_url TEXT;
  UPDATE saved_media
    SET source_url = (SELECT image_remote_url FROM cached_items WHERE local_id = saved_media.local_id),
        license_url = (SELECT image_license_url FROM cached_items WHERE local_id = saved_media.local_id)
    WHERE file_name IS NOT NULL;
  PRAGMA user_version = 4;
`;

export const MIGRATE_TO_READING_CHECKPOINT_SQL = `
  CREATE TABLE reading_checkpoint (
    account_id INTEGER PRIMARY KEY CHECK (account_id > 0),
    local_id TEXT NOT NULL REFERENCES cached_items(local_id) ON DELETE CASCADE,
    paragraph INTEGER NOT NULL CHECK (paragraph >= 0),
    fingerprint TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE INDEX idx_checkpoint_item ON reading_checkpoint(local_id);
  PRAGMA user_version = 5;
`;

export const MIGRATE_TO_READING_HISTORY_SQL = `
  CREATE TABLE reading_history (
    account_id INTEGER NOT NULL CHECK (account_id > 0),
    local_id TEXT NOT NULL REFERENCES cached_items(local_id) ON DELETE CASCADE,
    read_at TEXT NOT NULL,
    PRIMARY KEY (account_id, local_id)
  );
  CREATE INDEX idx_reading_history_item ON reading_history(local_id);
  PRAGMA user_version = 6;
`;
