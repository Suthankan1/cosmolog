# Local data model

SQLite owns public discovery records, feed membership, source metadata, bookmarks, private notes, and image status. SecureStore owns the verified session and tokens. The two stores have independent failure paths.

| Table | Identity | Purpose |
| --- | --- | --- |
| `cached_items` | `local_id`, built as `source:externalId` | Text, publication date, source and credit, validated HTTPS URLs, optional image license, fetch and update time |
| `feed_membership` | `source, local_id` | Latest successfully loaded list and source ordering |
| `sync_metadata` | source key | Last attempt, last committed success, and sanitized error |
| `favourites` | `account_id, local_id` | Saved date and one trimmed field note of up to 1,000 characters |
| `saved_media` | `local_id` | Waiting, ready, or failed state, relative app-private filename, and byte count |

## Migration and ownership

The original unversioned schema migrates through three versions in a transaction. Version 1 introduces source membership, account ownership, and media status. Version 2 adds notes. Version 3 retains image license URLs. Legacy bookmarks start unassigned under account zero. Import explicitly assigns them to the active account; orphan relationships are excluded.

The reader and writer use separate SQLite connections. The writer enables foreign keys and serializes transactions. Feed membership, media, and bookmarks refer to a cached item. Only unreferenced records older than 30 days are eligible for pruning. File cleanup retains a validated file until its last bookmark is removed. A missing file is shown as unavailable while it awaits a retry.
