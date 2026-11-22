import { configureStore } from '@reduxjs/toolkit';
import { commitFeedSnapshot, getCachedFeed } from '../src/database/repositories/discoveryRepository';
import { getSyncMetadata, recordSyncFailure } from '../src/database/repositories/syncMetadataRepository';
import { fetchNasaApodFeed } from '../src/services/api/nasaApodService';
import { fetchSpaceflightNewsFeed } from '../src/services/api/spaceflightNewsService';
import feed, { loadCachedFeedThunk, setConnection, syncRemoteFeedThunk } from '../src/store/slices/feedSlice';

jest.mock('../src/database/repositories/discoveryRepository');
jest.mock('../src/database/repositories/syncMetadataRepository');
jest.mock('../src/services/api/nasaApodService');
jest.mock('../src/services/api/spaceflightNewsService');

const time = '2026-11-22T00:00:00.000Z';
const metadata = { lastSyncedAt: time, lastAttemptAt: time, error: null };

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(getCachedFeed).mockResolvedValue([]);
  jest.mocked(getSyncMetadata).mockResolvedValue(metadata);
  jest.mocked(recordSyncFailure).mockResolvedValue();
});

it('waits for SQLite, coalesces overlapping refreshes, and commits an empty response for the successful source', async () => {
  const store = configureStore({ reducer: { feed, auth: () => ({ isAuthenticated: true }) } });
  store.dispatch(setConnection('online'));
  await store.dispatch(syncRemoteFeedThunk());
  expect(fetchNasaApodFeed).not.toHaveBeenCalled();
  await store.dispatch(loadCachedFeedThunk());
  expect(store.getState().feed.cacheStatus).toBe('ready');
  jest.mocked(fetchNasaApodFeed).mockRejectedValue(new Error('service outage'));
  jest.mocked(fetchSpaceflightNewsFeed).mockResolvedValue([]);
  await Promise.all([store.dispatch(syncRemoteFeedThunk()), store.dispatch(syncRemoteFeedThunk())]);
  expect(fetchNasaApodFeed).toHaveBeenCalledTimes(1);
  expect(commitFeedSnapshot).toHaveBeenCalledTimes(1);
  expect(commitFeedSnapshot).toHaveBeenCalledWith('spaceflight-news', [], expect.any(String));
  expect(recordSyncFailure).toHaveBeenCalledWith('nasa-apod', expect.any(String));
  expect(store.getState().feed.metadata['nasa-apod']).toMatchObject({
    lastSyncedAt: time, error: expect.any(String),
  });
});
