# Local data model

## DiscoveryItem
Suggested normalized shape:
```ts
type DiscoverySource = 'nasa-apod' | 'spaceflight-news';

type DiscoveryItem = {
  localId: string;           // `${source}:${externalId}`
  source: DiscoverySource;
  externalId: string;
  title: string;
  summary: string;
  body: string;
  publishedAt: string | null; // ISO timestamp/date from source
  imageRemoteUrl: string | null;
  imageLocalUri: string | null;
  canonicalUrl: string | null;
  attribution: string | null;
  author: string | null;
  mediaType: 'image' | 'video' | 'article' | 'unknown';
  fetchedAt: string;          // successful fetch timestamp
  updatedAt: string;          // local upsert timestamp
};
```

## SQLite tables
### `cached_items`
- `local_id TEXT PRIMARY KEY`
- `source TEXT NOT NULL`
- `external_id TEXT NOT NULL`
- `title TEXT NOT NULL`
- `summary TEXT NOT NULL`
- `body TEXT NOT NULL`
- `published_at TEXT`
- `image_remote_url TEXT`
- `image_local_uri TEXT`
- `canonical_url TEXT`
- `attribution TEXT`
- `author TEXT`
- `media_type TEXT NOT NULL`
- `fetched_at TEXT NOT NULL`
- `updated_at TEXT NOT NULL`
- Unique constraint `(source, external_id)`.

### `favourites`
- `local_id TEXT PRIMARY KEY REFERENCES cached_items(local_id)`
- `added_at TEXT NOT NULL`
- Optional local annotation field only if scope remains stable.
- Favourite is a relationship, not a duplicated copy of the entire API record.

### `sync_metadata`
- `feed_key TEXT PRIMARY KEY`
- `last_synced_at TEXT`
- `last_attempt_at TEXT`
- `last_error_code TEXT`
- `cursor_or_page TEXT` only if source pagination requires it.

## Repository contracts
- `getCachedFeed(feedKey)`
- `getItem(localId)`
- `upsertItems(items)` — transaction + conflict update
- `addFavourite(localId)`
- `removeFavourite(localId)`
- `getFavourites()`
- `isFavourite(localId)`
- `updateSyncMetadata(...)`
- `getLastSuccessfulSync(feedKey)`

## Invariants
- Never overwrite favourite state during feed upsert.
- No duplicate `local_id`.
- Only set `last_synced_at` after validated data is committed.
- Store source attribution/canonical URL.
- Keep auth tokens out of this schema.
- Use bound parameters for every SQL query.
- Migrations must be versioned and tested.
