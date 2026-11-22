import { DiscoverySource } from '../navigation/types';

export interface DiscoveryItem {
  localId: string; // `${source}:${externalId}`
  source: DiscoverySource;
  externalId: string;
  title: string;
  summary: string;
  body: string;
  publishedAt: string | null;
  imageRemoteUrl: string | null;
  imageLocalUri: string | null;
  canonicalUrl: string | null;
  attribution: string | null;
  author: string | null;
  mediaType: 'image' | 'video' | 'article' | 'unknown';
  fetchedAt: string;
  updatedAt: string;
}

export interface CachedItemRow {
  local_id: string;
  source: string;
  external_id: string;
  title: string;
  summary: string;
  body: string;
  published_at: string | null;
  image_remote_url: string | null;
  image_local_uri: string | null;
  canonical_url: string | null;
  attribution: string | null;
  author: string | null;
  media_type: string;
  fetched_at: string;
  updated_at: string;
}

export function mapRowToDiscoveryItem(row: CachedItemRow): DiscoveryItem {
  return {
    localId: row.local_id,
    source: row.source as DiscoverySource,
    externalId: row.external_id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    publishedAt: row.published_at,
    imageRemoteUrl: row.image_remote_url,
    imageLocalUri: row.image_local_uri,
    canonicalUrl: row.canonical_url,
    attribution: row.attribution,
    author: row.author,
    mediaType: (row.media_type as DiscoveryItem['mediaType']) || 'unknown',
    fetchedAt: row.fetched_at,
    updatedAt: row.updated_at,
  };
}
