import { z } from 'zod';
import { DiscoveryItem } from '../../database/models';
import { isCalendarDate } from '../../navigation/types';
import { stripHtml } from '../../utils/text';
import { fetchJson, HttpError } from '../http';
import { extractImageLicense, httpsUrl } from './mediaPolicy';

const NASA_APOD_URL = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic';
const headline = z.string().transform(stripHtml).pipe(z.string().min(1));

export const nasaApodItemSchema = z.object({
  date: z.string().refine(isCalendarDate),
  post_id: z.number().int().positive(),
  title: headline,
  explanation: z.string(),
  permalink: z.string().nullish(),
  credit: z.string().nullish(),
  copyright: z.string().nullish(),
  url: z.string().nullish(),
  hdurl: z.string().nullish(),
  media_type: z.string().nullish(),
});
export const nasaApodResponseSchema = z.array(nasaApodItemSchema);
type RawNasaApodItem = z.infer<typeof nasaApodItemSchema>;

export function normalizeNasaApodItem(raw: RawNasaApodItem): DiscoveryItem {
  const body = stripHtml(raw.explanation).replace(/^Explanation:\s*/i, '');
  const authorCredit = stripHtml(raw.credit || '');
  const copyright = stripHtml(raw.copyright || '');
  const credits = [...new Set([authorCredit, copyright].filter(Boolean))].join(' · ');
  const mediaType = raw.media_type === 'image'
    ? 'image' : ['video', 'iframe'].includes(raw.media_type ?? '') ? 'video' : 'unknown';
  const now = new Date().toISOString();

  return {
    localId: 'nasa-apod:' + raw.date,
    source: 'nasa-apod',
    externalId: raw.date,
    title: raw.title,
    summary: body.length > 220 ? body.slice(0, 217).trim() + '…' : body,
    body,
    publishedAt: raw.date,
    imageRemoteUrl: mediaType === 'image' ? httpsUrl(raw.hdurl) : null,
    imageLicenseUrl: extractImageLicense((raw.credit ?? '') + ' ' + (raw.copyright ?? '')),
    imageLocalUri: null,
    canonicalUrl: httpsUrl(raw.permalink) ?? httpsUrl(raw.url),
    attribution: credits || null,
    author: null,
    mediaType,
    fetchedAt: now,
    updatedAt: now,
  };
}

export async function fetchNasaApodFeed(signal?: AbortSignal): Promise<DiscoveryItem[]> {
  const json = await fetchJson(NASA_APOD_URL + '?page=1&per_page=8', { signal });
  return nasaApodResponseSchema.parse(json).map(normalizeNasaApodItem)
    .sort((a, b) => b.externalId.localeCompare(a.externalId));
}

export async function fetchNasaApodItem(date: string, signal?: AbortSignal): Promise<DiscoveryItem | null> {
  if (!isCalendarDate(date)) throw new Error('Invalid APOD date');
  const id = date.slice(2).replaceAll('-', '');
  try {
    const json = await fetchJson(NASA_APOD_URL + '/' + id, { signal });
    const raw = nasaApodItemSchema.parse(json);
    if (raw.date !== date) throw new Error('Unexpected APOD date');
    return normalizeNasaApodItem(raw);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}
