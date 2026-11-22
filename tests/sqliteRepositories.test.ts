import { resetDatabaseInstance } from '../src/database/db';
import {
  getCachedFeed,
  getDiscoveryItemById,
  updateLocalImageUri,
  upsertDiscoveryItems,
} from '../src/database/repositories/discoveryRepository';
import {
  addFavourite,
  getFavouriteLocalIds,
  getFavourites,
  isFavourite,
  removeFavourite,
} from '../src/database/repositories/favouritesRepository';
import {
  getLastSuccessfulSync,
  setLastSuccessfulSync,
} from '../src/database/repositories/syncMetadataRepository';
import { DiscoveryItem } from '../src/database/models';

interface MockItem {
  local_id: string;
  source: string;
  external_id: string;
  title: string;
  summary: string;
  body: string;
  published_at: string | null;
  image_remote_url: string | null;
  image_local_uri: string | null;
  canonical_url: string | null;
  attribution: string | null;
  author: string | null;
  media_type: string;
  fetched_at: string;
  updated_at: string;
}

// In-memory simulation of SQLite tables
const mockCachedItems = new Map<string, MockItem>();
const mockFavourites = new Map<string, string>();
const mockSyncMetadata = new Map<string, string>();

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => ({
    execAsync: jest.fn(async () => {}),
    withTransactionAsync: jest.fn(async (callback: () => Promise<void>) => {
      await callback();
    }),
    runAsync: jest.fn(async (sql: string, params: any[]) => {
      const trimmed = sql.trim().toUpperCase();

      if (trimmed.startsWith('INSERT INTO CACHED_ITEMS')) {
        const item: MockItem = {
          local_id: params[0],
          source: params[1],
          external_id: params[2],
          title: params[3],
          summary: params[4],
          body: params[5],
          published_at: params[6],
          image_remote_url: params[7],
          image_local_uri: params[8] || mockCachedItems.get(params[0])?.image_local_uri || null,
          canonical_url: params[9],
          attribution: params[10],
          author: params[11],
          media_type: params[12],
          fetched_at: params[13],
          updated_at: params[14],
        };
        mockCachedItems.set(params[0], item);
      } else if (trimmed.startsWith('INSERT OR IGNORE INTO FAVOURITES')) {
        mockFavourites.set(params[0], params[1]);
      } else if (trimmed.startsWith('DELETE FROM FAVOURITES')) {
        mockFavourites.delete(params[0]);
      } else if (trimmed.startsWith('INSERT INTO SYNC_METADATA')) {
        mockSyncMetadata.set(params[0], params[1]);
      } else if (trimmed.startsWith('UPDATE CACHED_ITEMS SET IMAGE_LOCAL_URI')) {
        const existing = mockCachedItems.get(params[1]);
        if (existing) {
          existing.image_local_uri = params[0];
        }
      }
    }),
    getAllAsync: jest.fn(async (sql: string, params: any[] = []) => {
      const trimmed = sql.trim().toUpperCase();

      if (trimmed.includes('FROM FAVOURITES F')) {
        const result: any[] = [];
        for (const [localId, addedAt] of mockFavourites.entries()) {
          const item = mockCachedItems.get(localId);
          if (item) {
            result.push({ ...item, added_at: addedAt });
          }
        }
        return result;
      }

      if (trimmed.startsWith('SELECT LOCAL_ID FROM FAVOURITES')) {
        return Array.from(mockFavourites.keys()).map((id) => ({ local_id: id }));
      }

      if (trimmed.startsWith('SELECT * FROM CACHED_ITEMS')) {
        if (params.length > 0) {
          return Array.from(mockCachedItems.values()).filter((i) => i.source === params[0]);
        }
        return Array.from(mockCachedItems.values());
      }

      return [];
    }),
    getFirstAsync: jest.fn(async (sql: string, params: any[] = []) => {
      const trimmed = sql.trim().toUpperCase();

      if (trimmed.includes('COUNT(*) AS COUNT FROM FAVOURITES')) {
        return { count: mockFavourites.has(params[0]) ? 1 : 0 };
      }

      if (trimmed.startsWith('SELECT * FROM CACHED_ITEMS WHERE LOCAL_ID = ?')) {
        return mockCachedItems.get(params[0]) || null;
      }

      if (trimmed.startsWith('SELECT LAST_SYNCED_AT FROM SYNC_METADATA')) {
        const val = mockSyncMetadata.get(params[0]);
        return val ? { last_synced_at: val } : null;
      }

      return null;
    }),
  })),
}));

describe('SQLite Repositories and Offline Storage', () => {
  beforeEach(() => {
    mockCachedItems.clear();
    mockFavourites.clear();
    mockSyncMetadata.clear();
    resetDatabaseInstance();
  });

  const sampleItem: DiscoveryItem = {
    localId: 'nasa-apod:2026-11-22',
    source: 'nasa-apod',
    externalId: '2026-11-22',
    title: 'Swirls on Jupiter',
    summary: 'Cloud formations captured by Juno',
    body: 'Complete scientific explanation of the Jovian atmosphere.',
    publishedAt: '2026-11-22',
    imageRemoteUrl: 'https://nasa.gov/jupiter.jpg',
    imageLocalUri: null,
    canonicalUrl: 'https://science.nasa.gov/apod-jupiter',
    attribution: 'NASA / JPL',
    author: 'Astronomy Picture of the Day',
    mediaType: 'image',
    fetchedAt: '2026-11-22T10:00:00Z',
    updatedAt: '2026-11-22T10:00:00Z',
  };

  it('upserts discovery items idempotently without creating duplicate entries', async () => {
    await upsertDiscoveryItems([sampleItem]);
    await upsertDiscoveryItems([{ ...sampleItem, title: 'Updated Jupiter Title' }]);

    const feed = await getCachedFeed();
    expect(feed.length).toBe(1);
    expect(feed[0].title).toBe('Updated Jupiter Title');
    expect(feed[0].localId).toBe('nasa-apod:2026-11-22');
  });

  it('retrieves individual discovery items by local ID', async () => {
    await upsertDiscoveryItems([sampleItem]);
    const item = await getDiscoveryItemById('nasa-apod:2026-11-22');

    expect(item).not.toBeNull();
    expect(item?.title).toBe('Swirls on Jupiter');
    expect(await getDiscoveryItemById('non-existent:999')).toBeNull();
  });

  it('persists and deletes favourites accurately', async () => {
    await upsertDiscoveryItems([sampleItem]);

    expect(await isFavourite(sampleItem.localId)).toBe(false);

    await addFavourite(sampleItem.localId);
    expect(await isFavourite(sampleItem.localId)).toBe(true);

    const favList = await getFavourites();
    expect(favList.length).toBe(1);
    expect(favList[0].localId).toBe(sampleItem.localId);
    expect(favList[0].addedAt).toBeDefined();

    const ids = await getFavouriteLocalIds();
    expect(ids).toContain(sampleItem.localId);

    await removeFavourite(sampleItem.localId);
    expect(await isFavourite(sampleItem.localId)).toBe(false);
    expect((await getFavourites()).length).toBe(0);
  });

  it('preserves local offline image URI during feed refresh upserts', async () => {
    await upsertDiscoveryItems([sampleItem]);
    await updateLocalImageUri(sampleItem.localId, 'file:///data/cosmolog/local_jupiter.jpg');

    // Simulate remote refresh with new fetchedAt/title
    await upsertDiscoveryItems([{ ...sampleItem, title: 'Refreshed Title' }]);

    const item = await getDiscoveryItemById(sampleItem.localId);
    expect(item?.imageLocalUri).toBe('file:///data/cosmolog/local_jupiter.jpg');
    expect(item?.title).toBe('Refreshed Title');
  });

  it('records and reads truthful sync metadata timestamps', async () => {
    expect(await getLastSuccessfulSync('discovery_feed')).toBeNull();

    const syncTime = '2026-11-22T12:30:00.000Z';
    await setLastSuccessfulSync('discovery_feed', syncTime);

    expect(await getLastSuccessfulSync('discovery_feed')).toBe(syncTime);
  });
});
