import { parseDetailsParams } from '../src/navigation/types';

it.each([
  ['nasa-apod', '2026-11-22'],
  ['nasa-apod', '2024-02-29'],
  ['spaceflight-news', '12345'],
])('accepts a valid %s identifier', (source, id) => {
  expect(parseDetailsParams({ source, id })).toEqual({ source, id });
});

it.each([
  ['nasa-apod', '%E0%A4%A'],
  ['nasa-apod', '2026-02-29'],
  ['spaceflight-news', 'articles/2'],
  ['spaceflight-news', '9007199254740992'],
  ['spaceflight-news', '0'],
  ['unsupported-blog', '123'],
])('rejects an invalid %s identifier %s', (source, id) => {
  expect(parseDetailsParams({ source, id })).toBeNull();
});

it('rejects ambiguous route parameters', () => {
  expect(parseDetailsParams({ source: ['nasa-apod', 'spaceflight-news'], id: ['2026-11-22'] })).toBeNull();
});
