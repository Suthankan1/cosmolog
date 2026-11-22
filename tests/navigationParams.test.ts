import { parseDetailsParams } from '../src/navigation/types';

describe('Navigation Parameter Validation', () => {
  it('parses valid NASA APOD parameters', () => {
    const result = parseDetailsParams({
      source: 'nasa-apod',
      id: '2026-11-22',
    });

    expect(result).not.toBeNull();
    expect(result?.source).toBe('nasa-apod');
    expect(result?.id).toBe('2026-11-22');
  });

  it('parses valid Spaceflight News parameters and decodes encoded IDs', () => {
    const result = parseDetailsParams({
      source: 'spaceflight-news',
      id: encodeURIComponent('article-12345:space-x'),
    });

    expect(result).not.toBeNull();
    expect(result?.source).toBe('spaceflight-news');
    expect(result?.id).toBe('article-12345:space-x');
  });

  it('handles array parameters from Expo Router query parsing', () => {
    const result = parseDetailsParams({
      source: ['nasa-apod'],
      id: ['apod-sample'],
    });

    expect(result).not.toBeNull();
    expect(result?.source).toBe('nasa-apod');
    expect(result?.id).toBe('apod-sample');
  });

  it('rejects unsupported or arbitrary sources', () => {
    const result = parseDetailsParams({
      source: 'unsupported-blog',
      id: '123',
    });

    expect(result).toBeNull();
  });

  it('rejects missing or empty identifiers', () => {
    expect(parseDetailsParams({ source: 'nasa-apod', id: '' })).toBeNull();
    expect(parseDetailsParams({ source: 'nasa-apod', id: '   ' })).toBeNull();
    expect(parseDetailsParams({ source: '', id: '123' })).toBeNull();
  });
});
