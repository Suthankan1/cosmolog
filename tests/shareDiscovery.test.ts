import { shareDiscoveryContent } from '../src/features/discovery/shareDiscovery';

const item = {
  title: 'Rings of Saturn',
  source: 'nasa-apod' as const,
  author: null,
  attribution: 'NASA/JPL-Caltech',
  canonicalUrl: 'https://apod.nasa.gov/apod/ap000101.html',
  note: 'Private study notes',
  imageLocalUri: 'file:///my/archive/photo.jpg',
};

it('shares only public title, credit and canonical link', () => {
  expect(shareDiscoveryContent(item)).toEqual({
    title: 'Rings of Saturn',
    message: 'Rings of Saturn\nNASA Astronomy Picture of the Day · NASA/JPL-Caltech\nhttps://apod.nasa.gov/apod/ap000101.html',
  });
  expect(shareDiscoveryContent({ ...item, source: 'spaceflight-news', attribution: 'Publisher' })?.message)
    .toBe('Rings of Saturn\nPublisher\nhttps://apod.nasa.gov/apod/ap000101.html');
});

it('requires a valid HTTPS publication link without embedded credentials', () => {
  expect(shareDiscoveryContent({ ...item, canonicalUrl: null })).toBeNull();
  expect(shareDiscoveryContent({ ...item, canonicalUrl: 'https://user:pass@example.com/article' })).toBeNull();
});
