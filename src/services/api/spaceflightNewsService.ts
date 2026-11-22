import { z } from 'zod';
import { DiscoveryItem } from '../../database/models';
import { isNewsId } from '../../navigation/types';
import { stripHtml } from '../../utils/text';
import { fetchJson, HttpError } from '../http';
import { httpsUrl } from './mediaPolicy';

const SPACEFLIGHT_NEWS_URL = 'https://api.spaceflightnewsapi.net/v4/articles/';

export const spaceflightArticleSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().transform(stripHtml).pipe(z.string().min(1)),
  summary: z.string(),
  url: z.string().nullish(),
  image_url: z.string().nullish(),
  news_site: z.string().nullish(),
  published_at: z.string().nullish(),
  authors: z.array(z.object({ name: z.string() })).nullish(),
});

export const spaceflightFeedResponseSchema = z.object({ results: z.array(spaceflightArticleSchema) });
type RawSpaceflightArticle = z.infer<typeof spaceflightArticleSchema>;

export function normalizeSpaceflightArticle(raw: RawSpaceflightArticle): DiscoveryItem {
  const summary = stripHtml(raw.summary);
  const published = raw.published_at ? Date.parse(raw.published_at) : NaN;
  const now = new Date().toISOString();

  return {
    localId: 'spaceflight-news:' + raw.id,
    source: 'spaceflight-news',
    externalId: String(raw.id),
    title: raw.title,
    summary,
    body: summary,
    publishedAt: Number.isFinite(published) ? new Date(published).toISOString() : null,
    imageRemoteUrl: httpsUrl(raw.image_url),
    imageLocalUri: null,
    canonicalUrl: httpsUrl(raw.url),
    attribution: raw.news_site?.trim() || null,
    author: raw.authors?.map(author => author.name.trim()).filter(Boolean).join(', ') || null,
    mediaType: 'article',
    fetchedAt: now,
    updatedAt: now,
  };
}

export async function fetchSpaceflightNewsFeed(signal?: AbortSignal): Promise<DiscoveryItem[]> {
  const json = await fetchJson(SPACEFLIGHT_NEWS_URL + '?limit=15&ordering=-published_at', { signal });
  return spaceflightFeedResponseSchema.parse(json).results.map(normalizeSpaceflightArticle);
}

export async function fetchSpaceflightNewsItem(id: string, signal?: AbortSignal): Promise<DiscoveryItem | null> {
  if (!isNewsId(id)) throw new Error('Invalid article ID');
  try {
    const json = await fetchJson(SPACEFLIGHT_NEWS_URL + id + '/', { signal });
    const raw = spaceflightArticleSchema.parse(json);
    if (String(raw.id) !== id) throw new Error('Unexpected article ID');
    return normalizeSpaceflightArticle(raw);
  } catch (error) {
    if (error instanceof HttpError && error.status === 404) return null;
    throw error;
  }
}
