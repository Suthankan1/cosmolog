import {
  nasaApodResponseSchema,
  normalizeNasaApodItem,
} from '../src/services/api/nasaApodService';
import {
  normalizeSpaceflightArticle,
  spaceflightFeedResponseSchema,
} from '../src/services/api/spaceflightNewsService';

describe('Discovery Normalization and Zod Validation', () => {
  describe('NASA APOD Adapter', () => {
    const rawApod = {
      date: '2026-11-22',
      post_id: 1514357,
      title: 'Swirls and Colors on Jupiter from Juno',
      explanation: '<strong>Explanation:</strong> What creates the colors in Jupiter clouds? <a href="https://nasa.gov">Jupiter</a> is mostly hydrogen.',
      permalink: 'https://science.nasa.gov/image-article/apod-jupiter/',
      credit: 'NASA, <a href="http://juno.edu">Juno</a>',
      copyright: null,
      url: 'https://assets.science.nasa.gov/jupiter.jpg',
      hdurl: 'https://assets.science.nasa.gov/jupiter_hd.jpg',
      media_type: 'image',
    };

    it('validates schema from live NASA APOD replacement endpoint', () => {
      const parsed = nasaApodResponseSchema.safeParse([rawApod]);
      expect(parsed.success).toBe(true);
    });

    it('normalizes NASA item into clean DiscoveryItem without HTML tags', () => {
      const normalized = normalizeNasaApodItem(rawApod);

      expect(normalized.localId).toBe('nasa-apod:2026-11-22');
      expect(normalized.source).toBe('nasa-apod');
      expect(normalized.externalId).toBe('2026-11-22');
      expect(normalized.title).toBe('Swirls and Colors on Jupiter from Juno');
      expect(normalized.body).not.toContain('<strong>');
      expect(normalized.body).not.toContain('<a href');
      expect(normalized.body).toContain('What creates the colors in Jupiter clouds?');
      expect(normalized.attribution).toBe('NASA, Juno');
      expect(normalized.imageRemoteUrl).toBe('https://assets.science.nasa.gov/jupiter_hd.jpg');
    });

    it('rejects invalid NASA payload with missing required fields', () => {
      const invalid = [{ title: 'No Date or Explanation' }];
      const parsed = nasaApodResponseSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
    });
  });

  describe('Spaceflight News Adapter', () => {
    const rawArticle = {
      id: 40930,
      title: 'Live coverage: SpaceX to launch satellites',
      summary: 'The NROL-136 mission will be the fourth launch of the year. Liftoff from pad 4E.',
      url: 'https://spaceflightnow.com/spacex-launch/',
      image_url: 'https://spaceflightnow.com/falcon9.jpg',
      news_site: 'Spaceflight Now',
      published_at: '2026-11-21T16:50:51Z',
      authors: [{ name: 'Will Robinson-Smith' }],
    };

    it('validates Spaceflight News v4 response schema', () => {
      const parsed = spaceflightFeedResponseSchema.safeParse({
        count: 1,
        results: [rawArticle],
      });
      expect(parsed.success).toBe(true);
    });

    it('normalizes Spaceflight News article into DiscoveryItem', () => {
      const normalized = normalizeSpaceflightArticle(rawArticle);

      expect(normalized.localId).toBe('spaceflight-news:40930');
      expect(normalized.source).toBe('spaceflight-news');
      expect(normalized.externalId).toBe('40930');
      expect(normalized.author).toBe('Will Robinson-Smith');
      expect(normalized.attribution).toBe('Spaceflight Now');
      expect(normalized.mediaType).toBe('article');
    });
  });
});

it('uses the APOD permalink as the source and preserves an explicit image license', () => {
  const item = normalizeNasaApodItem({
    date: '2026-11-22', post_id: 1, title: 'Jupiter', explanation: 'A view of Jupiter.',
    url: 'https://science.nasa.gov/image-article/jupiter/', media_type: 'image',
    copyright: 'Observer · <a href="https://creativecommons.org/licenses/by-nc/3.0/">License</a>',
  });
  expect(item.imageRemoteUrl).toBeNull();
  expect(item.canonicalUrl).toBe('https://science.nasa.gov/image-article/jupiter/');
  expect(item.imageLicenseUrl).toBe('https://creativecommons.org/licenses/by-nc/3.0/');
});

it('does not invent an undated dispatch date or accept a non-HTTPS source link', () => {
  const article = normalizeSpaceflightArticle({ id: 1, title: 'Launch', summary: 'Update', url: 'http://example.com' });
  expect(article.publishedAt).toBeNull();
  expect(article.canonicalUrl).toBeNull();
});
