import { extractImageLicense, httpsUrl, mayDownloadImage } from '../src/services/api/mediaPolicy';

const asset = 'https://assets.science.nasa.gov/photo.jpg';
const license = 'https://creativecommons.org/licenses/by-nc/3.0/';

it('preserves supported Creative Commons licenses and permits saving the licensed image', () => {
  expect(extractImageLicense('<a href="' + license + '">License</a>')).toBe(license);
  expect(mayDownloadImage('nasa-apod', asset, 'Named contributor', license)).toBe(true);
});

it('treats unlicensed third-party credits, false license hosts, and insecure URLs as text-only', () => {
  expect(mayDownloadImage('nasa-apod', asset, 'Named contributor', null)).toBe(false);
  expect(mayDownloadImage('spaceflight-news', asset, 'NASA', license)).toBe(false);
  expect(mayDownloadImage('nasa-apod', 'http://nasa.gov/photo.jpg', 'NASA', license)).toBe(false);
  expect(extractImageLicense('<a href="https://creativecommons.org.fake/licenses/by/4.0/">License</a>')).toBeNull();
  expect(httpsUrl('https://someone:password@example.com')).toBeNull();
});
