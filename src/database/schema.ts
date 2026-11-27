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

export const MIGRATE_TO_COLLECTIONS_SQL = `
  CREATE TABLE shelf_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL CHECK (account_id > 0),
    name TEXT NOT NULL COLLATE NOCASE CHECK (length(name) BETWEEN 1 AND 64),
    UNIQUE (account_id, name),
    UNIQUE (account_id, id)
  );
  CREATE TABLE shelf_collection_items (
    account_id INTEGER NOT NULL,
    collection_id INTEGER NOT NULL,
    local_id TEXT NOT NULL,
    PRIMARY KEY (account_id, collection_id, local_id),
    FOREIGN KEY (account_id, collection_id) REFERENCES shelf_collections(account_id, id) ON DELETE CASCADE,
    FOREIGN KEY (account_id, local_id) REFERENCES favourites(account_id, local_id) ON DELETE CASCADE
  );
  CREATE INDEX idx_collection_item_bookmark ON shelf_collection_items(account_id, local_id);
  PRAGMA user_version = 7;
`;

export const MIGRATE_TO_READING_PACKS_SQL = `
  CREATE TABLE reading_pack_items (
    account_id INTEGER NOT NULL CHECK (account_id > 0),
    pack_id TEXT NOT NULL,
    local_id TEXT NOT NULL REFERENCES cached_items(local_id) ON DELETE CASCADE,
    added_at TEXT NOT NULL,
    PRIMARY KEY (account_id, pack_id, local_id)
  );
  CREATE INDEX idx_pack_items_discovery ON reading_pack_items(local_id);
  CREATE VIEW offline_item_owners AS
    SELECT account_id, local_id, added_at FROM favourites
    UNION ALL
    SELECT account_id, local_id, added_at FROM reading_pack_items;
  PRAGMA user_version = 8;
`;

export const MIGRATE_TO_SKY_ORBITS_SQL = `
  CREATE TABLE sky_satellite_orbits (
    norad_id INTEGER PRIMARY KEY,
    attempted_at INTEGER NOT NULL,
    elements_json TEXT,
    epoch_at INTEGER,
    downloaded_at INTEGER,
    failure TEXT CHECK (failure IN ('unavailable', 'paused'))
  );
  PRAGMA user_version = 9;
`;

export const MIGRATE_TO_STUDY_SQL = `
  CREATE TABLE study_entries (
    id TEXT PRIMARY KEY, title TEXT NOT NULL COLLATE NOCASE, category TEXT NOT NULL,
    body TEXT NOT NULL, source TEXT NOT NULL, url TEXT NOT NULL, related TEXT NOT NULL,
    chapter INTEGER, sky INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX study_titles ON study_entries(title);
  CREATE TABLE study_aliases (name TEXT COLLATE NOCASE, entry_id TEXT REFERENCES study_entries(id), PRIMARY KEY(name,entry_id));
  CREATE TABLE study_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  CREATE TABLE study_bookmarks (account INTEGER, entry_id TEXT REFERENCES study_entries(id), PRIMARY KEY(account,entry_id));
  CREATE TABLE study_progress (account INTEGER PRIMARY KEY, entry_id TEXT REFERENCES study_entries(id), section INTEGER NOT NULL);
  PRAGMA user_version = 10;
`;

export const MIGRATE_TO_STUDY_PACKS_SQL = `
  CREATE TABLE study_packs(id TEXT PRIMARY KEY,revision INTEGER NOT NULL,bytes INTEGER NOT NULL,installed_at TEXT NOT NULL);
  ALTER TABLE study_entries ADD COLUMN pack_id TEXT;
  PRAGMA user_version = 11;
`;

export const MIGRATE_TO_STUDY_ANCHORS_SQL = `
  ALTER TABLE study_bookmarks ADD COLUMN section_anchor TEXT;
  ALTER TABLE study_bookmarks ADD COLUMN note TEXT;
  ALTER TABLE study_progress ADD COLUMN section_anchor TEXT;
  PRAGMA user_version = 12;
`;

export const MIGRATE_TO_DISPATCH_PAGES_SQL = `
  CREATE TABLE dispatch_paging (id INTEGER PRIMARY KEY CHECK(id = 1), generation TEXT NOT NULL,
    anchor TEXT, next_offset INTEGER);
  CREATE INDEX idx_feed_position ON feed_membership(source, position);
  PRAGMA user_version = 13;
`;

export const MIGRATE_TO_ARCHIVE_SEARCH_SQL = `
  ALTER TABLE cached_items ADD COLUMN search_title TEXT NOT NULL DEFAULT '';
  ALTER TABLE cached_items ADD COLUMN search_text TEXT NOT NULL DEFAULT '';
  CREATE TABLE last_search(account_id INTEGER NOT NULL, category TEXT NOT NULL, query TEXT NOT NULL,
    PRIMARY KEY(account_id, category));
  CREATE TABLE search_members(account_id INTEGER NOT NULL, category TEXT NOT NULL, position INTEGER NOT NULL,
    local_id TEXT NOT NULL REFERENCES cached_items(local_id), PRIMARY KEY(account_id, category, position),
    FOREIGN KEY(account_id, category) REFERENCES last_search(account_id, category) ON DELETE CASCADE);
  CREATE INDEX idx_search_members_item ON search_members(local_id);
  PRAGMA user_version = 14;
`;

export const MIGRATE_TO_EXPEDITIONS_SQL = `
  CREATE TABLE expedition_progress (
    account_id INTEGER NOT NULL CHECK (account_id > 0),
    expedition_id TEXT NOT NULL,
    step_id TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    PRIMARY KEY (account_id, expedition_id, step_id)
  );
  CREATE INDEX idx_expedition_progress_account ON expedition_progress(account_id, expedition_id);
  PRAGMA user_version = 15;
`;

export const MIGRATE_TO_EXPEDITION_REVISIONS_SQL = `
  ALTER TABLE expedition_progress ADD COLUMN revision INTEGER NOT NULL DEFAULT 1;
  PRAGMA user_version = 16;
`;

export const MIGRATE_TO_OBSERVATIONS_SQL = `
  CREATE TABLE observations (
    id TEXT PRIMARY KEY,
    account_id INTEGER NOT NULL CHECK (account_id > 0),
    title TEXT NOT NULL,
    notes TEXT NOT NULL,
    observed_at TEXT NOT NULL,
    timezone TEXT NOT NULL,
    target_id TEXT,
    target_name TEXT,
    conditions TEXT,
    linked_discovery_id TEXT,
    linked_study_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (linked_discovery_id) REFERENCES cached_items(local_id) ON DELETE SET NULL
  );

  CREATE INDEX idx_observations_account_observed ON observations(account_id, observed_at DESC);
  CREATE INDEX idx_observations_account_target ON observations(account_id, target_id);
  PRAGMA user_version = 17;
`;

export const MIGRATE_TO_OBSERVATION_ATTACHMENTS_SQL = `
  ALTER TABLE observations ADD COLUMN latitude REAL;
  ALTER TABLE observations ADD COLUMN longitude REAL;
  ALTER TABLE observations ADD COLUMN location_name TEXT;
  ALTER TABLE observations ADD COLUMN image_file_name TEXT;
  ALTER TABLE observations ADD COLUMN image_bytes INTEGER NOT NULL DEFAULT 0;
  PRAGMA user_version = 18;
`;

export const MIGRATE_TO_INSTRUMENT_SNAPSHOT_SQL = `
  ALTER TABLE observations ADD COLUMN instrument_snapshot TEXT;
  PRAGMA user_version = 19;
`;

export const MIGRATE_TO_READER_PREFERENCES_SQL = `
  CREATE TABLE reader_preferences (
    account_id INTEGER PRIMARY KEY CHECK (account_id > 0),
    theme TEXT NOT NULL DEFAULT 'editorial' CHECK (theme IN ('editorial', 'night')),
    speech_rate REAL NOT NULL DEFAULT 1.0,
    voice_id TEXT,
    updated_at TEXT NOT NULL
  );
  PRAGMA user_version = 20;
`;



