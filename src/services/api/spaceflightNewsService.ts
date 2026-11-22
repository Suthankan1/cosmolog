import { z } from 'zod';
import { DiscoveryItem } from '../../database/models';
import { stripHtml } from '../../utils/text';

export const spaceflightArticleSchema = z.object({
  id: z.number(),
  title: z.string(),
  summary: z.string(),
  url: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  news_site: z.string().optional().nullable(),
  published_at: z.string().optional().nullable(),
  authors: z
    .array(
      z.object({
        name: z.string(),
      })
    )
    .optional()
    .nullable(),
});

export const spaceflightFeedResponseSchema = z.object({
  count: z.number().optional(),
  results: z.array(spaceflightArticleSchema),
});

export type RawSpaceflightArticle = z.infer<typeof spaceflightArticleSchema>;

const SPACEFLIGHT_NEWS_URL = 'https://api.spaceflightnewsapi.net/v4/articles/';

export function normalizeSpaceflightArticle(raw: RawSpaceflightArticle): DiscoveryItem {
  const cleanSummary = stripHtml(raw.summary);
  const authorName =
    raw.authors && raw.authors.length > 0 ? raw.authors[0].name : raw.news_site || 'Spaceflight News';

  const attribution = raw.news_site || 'Spaceflight News API';
  const now = new Date().toISOString();

  return {
    localId: `spaceflight-news:${raw.id}`,
    source: 'spaceflight-news',
    externalId: String(raw.id),
    title: stripHtml(raw.title),
    summary: cleanSummary,
    body: cleanSummary,
    publishedAt: raw.published_at || now,
    imageRemoteUrl: raw.image_url || null,
    imageLocalUri: null,
    canonicalUrl: raw.url || null,
    attribution,
    author: authorName,
    mediaType: 'article',
    fetchedAt: now,
    updatedAt: now,
  };
}

export async function fetchSpaceflightNewsFeed(limit: number = 15): Promise<DiscoveryItem[]> {
  const response = await fetch(`${SPACEFLIGHT_NEWS_URL}?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`Spaceflight News service returned HTTP ${response.status}`);
  }

  const json = await response.json();
  const parsed = spaceflightFeedResponseSchema.safeParse(json);

  if (!parsed.success) {
    throw new Error('Spaceflight News response validation failed');
  }

  return parsed.data.results.map(normalizeSpaceflightArticle);
}

export async function fetchSpaceflightNewsItem(id: string): Promise<DiscoveryItem | null> {
  const response = await fetch(`${SPACEFLIGHT_NEWS_URL}${id}/`);
  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  const parsed = spaceflightArticleSchema.safeParse(json);
  if (!parsed.success) {
    return null;
  }

  return normalizeSpaceflightArticle(parsed.data);
}
