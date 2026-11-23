import { z } from 'zod';
import type { DiscoveryItem } from '../../database/models';
import { isMediaId } from '../../navigation/types';
import { stripHtml } from '../../utils/text';
import { fetchJson } from '../http';
import { httpsUrl } from './mediaPolicy';

const entrySchema = z.object({
  data: z.array(z.object({
    nasa_id: z.string().refine(isMediaId), title: z.string().transform(stripHtml).pipe(z.string().min(1)),
    media_type: z.enum(['image', 'audio', 'video']), date_created: z.string().optional(),
    description: z.string().optional(), description_508: z.string().optional(), center: z.string().optional(),
    secondary_creator: z.string().optional(), photographer: z.string().optional(),
  })).nonempty(),
  links: z.array(z.object({ href: z.string(), rel: z.string(), render: z.string().optional() })).optional(),
});
const response = z.object({ collection: z.object({
  items: z.array(z.unknown()), links: z.array(z.object({ rel: z.string() })).optional(),
}) });

export function parseMediaPage(raw: unknown, offset: number) {
  const { collection } = response.parse(raw);
  const items: DiscoveryItem[] = [];
  for (const entry of collection.items) {
    const parsed = entrySchema.safeParse(entry);
    if (!parsed.success) continue;
    const data = parsed.data.data[0];
    const date = Date.parse(data.date_created ?? '');
    const body = stripHtml(data.description || data.description_508 || '');
    const now = new Date().toISOString();
    items.push({
      source: 'nasa-media', externalId: data.nasa_id, localId: 'nasa-media:' + data.nasa_id,
      title: data.title, body, summary: body, mediaType: data.media_type,
      publishedAt: Number.isFinite(date) ? new Date(date).toISOString() : null,
      author: data.photographer || data.secondary_creator || null, attribution: data.center || 'NASA Image and Video Library',
      imageRemoteUrl: httpsUrl(parsed.data.links?.find(link => link.rel === 'preview' && link.render === 'image')?.href),
      imageLocalUri: null, canonicalUrl: 'https://images.nasa.gov/details/' + encodeURIComponent(data.nasa_id),
      fetchedAt: now, updatedAt: now,
    });
  }
  if (collection.items.length && !items.length) throw new Error('Invalid NASA media records');
  return { items, nextOffset: collection.links?.some(link => link.rel === 'next') && items.length ? offset + 1 : null };
}

async function request(field: 'q' | 'nasa_id', value: string, offset: number, signal?: AbortSignal) {
  const url = new URL('https://images-api.nasa.gov/search');
  url.searchParams.set(field, value);
  url.searchParams.set('page', String(offset + 1));
  url.searchParams.set('page_size', '15');
  return parseMediaPage(await fetchJson(url.href, { signal }), offset);
}

export const searchNasaMedia = (query: string, offset: number, signal: AbortSignal) => request('q', query, offset, signal);
export async function fetchNasaMediaItem(id: string, signal?: AbortSignal) {
  if (!isMediaId(id)) throw new Error('Invalid NASA media ID');
  const page = await request('nasa_id', id, 0, signal);
  return page.items.find(item => item.externalId === id) ?? null;
}
