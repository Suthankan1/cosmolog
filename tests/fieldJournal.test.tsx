import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FieldNote } from '../src/features/journal/FieldNote';
import { selectShelf } from '../src/features/journal/selectShelf';
import type { FavouriteDiscoveryItem } from '../src/database/repositories/favouritesRepository';

jest.mock('../src/database/repositories/favouritesRepository', () => ({ NOTE_LIMIT: 1000 }));

const time = '2026-11-23T00:00:00.000Z';
const entry: FavouriteDiscoveryItem = {
  source: 'nasa-apod', externalId: '2026-11-21', localId: 'nasa-apod:2026-11-21',
  title: 'An earlier view of Neptune', summary: '', body: '', publishedAt: '2026-11-21',
  imageRemoteUrl: null, imageLocalUri: null, canonicalUrl: null, attribution: 'NASA',
  author: null, mediaType: 'image', fetchedAt: time, updatedAt: time, addedAt: time,
  note: 'Compare the blue clouds', mediaStatus: 'ready', imageBytes: 100, readAt: time,
};

it('searches note text and intersects both Shelf filters without reordering the original array', () => {
  const newer: FavouriteDiscoveryItem = {
    ...entry, localId: 'spaceflight-news:2', source: 'spaceflight-news', publishedAt: '2026-11-23',
    note: 'Compare dispatch coverage', mediaStatus: 'text-only', readAt: null,
  };
  const entries = [entry, newer];
  expect(selectShelf(entries, { query: ' compare ', withNotes: true, downloaded: true, sort: 'published' })).toEqual([entry]);
  expect(selectShelf(entries, { query: '', withNotes: false, downloaded: false, sort: 'published' })).toEqual([newer, entry]);
  expect(selectShelf(entries, { query: 'compare', withNotes: true, downloaded: false, unread: true, sort: 'saved' })).toEqual([newer]);
  expect(entries).toEqual([entry, newer]);
});

it('keeps a note draft visible after failure and lets the user retry', async () => {
  const onSave = jest.fn().mockRejectedValueOnce(new Error('disk full')).mockResolvedValueOnce(undefined);
  await render(<FieldNote note={null} onSave={onSave} />);
  await fireEvent.press(screen.getByRole('button', { name: 'Add a note' }));
  await fireEvent.changeText(screen.getByLabelText('Field note'), 'Keep this draft');
  await fireEvent.press(screen.getByRole('button', { name: 'Save note' }));
  expect(screen.getByDisplayValue('Keep this draft')).toBeTruthy();
  expect(screen.getByText(/Could not save/)).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Save note' }));
  expect(onSave).toHaveBeenNthCalledWith(2, 'Keep this draft');
  expect(screen.queryByLabelText('Field note')).toBeNull();
});
