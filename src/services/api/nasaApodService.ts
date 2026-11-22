import { z } from 'zod';
import { DiscoveryItem } from '../../database/models';
import { stripHtml } from '../../utils/text';

export const nasaApodItemSchema = z.object({
  date: z.string(),
  post_id: z.number(),
  title: z.string(),
  explanation: z.string(),
  permalink: z.string().optional().nullable(),
  credit: z.string().optional().nullable(),
  copyright: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  hdurl: z.string().optional().nullable(),
  media_type: z.string().optional().nullable(),
});

export const nasaApodResponseSchema = z.array(nasaApodItemSchema);

export type RawNasaApodItem = z.infer<typeof nasaApodItemSchema>;

const NASA_APOD_URL = 'https://science.nasa.gov/wp-json/wp/v2/apod-basic/';

export function normalizeNasaApodItem(raw: RawNasaApodItem): DiscoveryItem {
  const cleanBody = stripHtml(raw.explanation);
  const cleanSummary =
    cleanBody.length > 220 ? `${cleanBody.slice(0, 217).trim()}...` : cleanBody;

  const rawAttribution = raw.credit || raw.copyright || 'NASA / APOD';
  const cleanAttribution = stripHtml(rawAttribution);

  const imageUrl = raw.hdurl || raw.url || null;
  const canonicalUrl = raw.permalink || raw.url || null;

  const now = new Date().toISOString();

  return {
    localId: `nasa-apod:${raw.date}`,
    source: 'nasa-apod',
    externalId: raw.date,
    title: stripHtml(raw.title),
    summary: cleanSummary,
    body: cleanBody,
    publishedAt: raw.date,
    imageRemoteUrl: imageUrl,
    imageLocalUri: null,
    canonicalUrl,
    attribution: cleanAttribution,
    author: 'Astronomy Picture of the Day',
    mediaType: raw.media_type === 'video' ? 'video' : 'image',
    fetchedAt: now,
    updatedAt: now,
  };
}

export async function fetchNasaApodFeed(limit: number = 8): Promise<DiscoveryItem[]> {
  const response = await fetch(`${NASA_APOD_URL}?per_page=${limit}`);
  if (!response.ok) {
    throw new Error(`NASA APOD service returned HTTP ${response.status}`);
  }

  const json = await response.json();
  const parsed = nasaApodResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error('NASA APOD response validation failed');
  }

  return parsed.data.map(normalizeNasaApodItem);
}

export async function fetchNasaApodItem(date: string): Promise<DiscoveryItem | null> {
  const feed = await fetchNasaApodFeed(12);
  const match = feed.find((item) => item.externalId === date);
  return match || null;
}
