import { renderHook, waitFor, act } from '@testing-library/react-native';
import { useLibrarySearch } from '../src/features/discovery/useLibrarySearch';
import { readSearch, saveSearch, searchLibrary } from '../src/features/discovery/librarySearch';
import { fetchNewsPage } from '../src/services/api/spaceflightNewsService';
import { parseMediaPage, searchNasaMedia } from '../src/services/api/nasaMediaService';

jest.mock('../src/store', () => {
  const { configureStore } = jest.requireActual('@reduxjs/toolkit');
  const store = configureStore({ reducer: () => ({}) });
  return { useAppDispatch: () => store.dispatch };
});
jest.mock('../src/features/discovery/librarySearch');
jest.mock('../src/services/api/spaceflightNewsService');
jest.mock('../src/services/api/nasaMediaService', () => ({
  ...jest.requireActual('../src/services/api/nasaMediaService'), searchNasaMedia: jest.fn(),
}));
jest.mock('../src/database/repositories/discoveryRepository');

const photo = parseMediaPage({ collection: { items: [{ data: [{ nasa_id: 'Europa', title: 'Europa', media_type: 'image' }] }] } }, 0).items[0];

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(searchLibrary).mockResolvedValue({ total: 0, items: [] });
  jest.mocked(readSearch).mockResolvedValue([]);
  jest.mocked(saveSearch).mockResolvedValue();
});

it('keeps a healthy provider visible, retries only the failed source, and restores offline order', async () => {
  jest.mocked(fetchNewsPage).mockRejectedValueOnce(new Error('unavailable')).mockResolvedValue({ items: [], nextOffset: null });
  jest.mocked(searchNasaMedia).mockResolvedValue({ items: [photo], nextOffset: null });
  const { result, rerender } = await renderHook(({ online }: { online: boolean }) => useLibrarySearch(1, 'all', 'Europa', online),
    { initialProps: { online: true } });
  await waitFor(() => expect(result.current.errors).toEqual(['Spaceflight News']));
  await waitFor(() => expect(result.current.pending).toBe(false));
  expect(result.current.rows).toEqual([photo]);
  await act(async () => result.current.retry());
  await waitFor(() => expect(result.current.errors).toEqual([]));
  expect(searchNasaMedia).toHaveBeenCalledTimes(1);
  jest.mocked(readSearch).mockResolvedValue([photo]);
  await rerender({ online: false });
  await waitFor(() => expect(result.current.localCount).toBe(1));
  expect(fetchNewsPage).toHaveBeenCalledTimes(2);
});

it('discards late results after the reader changes the query and account', async () => {
  let release!: (value: { items: typeof photo[]; nextOffset: null }) => void;
  jest.mocked(searchNasaMedia).mockImplementationOnce(() => new Promise(resolve => { release = resolve; }))
    .mockResolvedValue({ items: [], nextOffset: null });
  const { result, rerender } = await renderHook(({ id, term }: { id: number; term: string }) =>
    useLibrarySearch(id, 'nasa-media', term, true), { initialProps: { id: 1, term: 'Europa' } });
  await waitFor(() => expect(searchNasaMedia).toHaveBeenCalledTimes(1));
  await rerender({ id: 2, term: 'Saturn' });
  await act(async () => release({ items: [photo], nextOffset: null }));
  await waitFor(() => expect(result.current.pending).toBe(false));
  expect(result.current.rows).toEqual([]);
  expect(saveSearch).toHaveBeenCalledTimes(1);
  expect(saveSearch).toHaveBeenCalledWith(2, 'nasa-media', 'Saturn', [], expect.anything());
});
