export function httpsUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

const nasaCredits = new Set([
  'NASA', 'NASA/SDO', 'NASA/JPL-Caltech', 'NASA/GSFC', 'NASA/Bill Anders',
]);

function isCreativeCommonsLicense(url: string | null): boolean {
  return Boolean(url && /^https:\/\/creativecommons\.org\/licenses\/(by|by-nc|by-sa|by-nc-sa)\/[1-4]\.0\/?$/.test(url));
}

export function extractImageLicense(creditHtml: string): string | null {
  for (const match of creditHtml.matchAll(/href\s*=\s*["']([^"']+)["']/gi)) {
    const url = httpsUrl(match[1]);
    if (isCreativeCommonsLicense(url)) return url;
  }
  return null;
}

/** Editorial downloads require a documented license or an established NASA-only credit. */
export function mayDownloadImage(
  source: string, url: string | null, credit: string | null, licenseUrl: string | null,
): boolean {
  if (source !== 'nasa-apod' || !credit) return false;
  const secureUrl = httpsUrl(url);
  if (!secureUrl) return false;
  if (isCreativeCommonsLicense(licenseUrl)) return true;
  const host = new URL(secureUrl).hostname;
  return nasaCredits.has(credit) && (host === 'nasa.gov' || host.endsWith('.nasa.gov'));
}
