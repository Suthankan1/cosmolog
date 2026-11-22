export type DiscoverySource = 'nasa-apod' | 'spaceflight-news';

export interface DetailsRouteParams {
  source: DiscoverySource;
  id: string;
}

/**
 * Validates and normalizes route parameters for the Details screen.
 * Per assignment rules, Details receives only item source and ID, never a serialized full object.
 */
export function parseDetailsParams(params: {
  source?: string | string[];
  id?: string | string[];
}): DetailsRouteParams | null {
  const sourceRaw = Array.isArray(params.source) ? params.source[0] : params.source;
  const idRaw = Array.isArray(params.id) ? params.id[0] : params.id;

  if (!sourceRaw || !idRaw) {
    return null;
  }

  if (sourceRaw !== 'nasa-apod' && sourceRaw !== 'spaceflight-news') {
    return null;
  }

  const decodedId = decodeURIComponent(idRaw).trim();
  if (!decodedId) {
    return null;
  }

  return {
    source: sourceRaw as DiscoverySource,
    id: decodedId,
  };
}

export interface RouterLike {
  push: (href: any) => void;
  replace: (href: any) => void;
  back: () => void;
}

/**
 * Type-safe navigation helper to push the Details screen.
 */
export function navigateToDetails(router: RouterLike, source: DiscoverySource, id: string): void {
  router.push({
    pathname: '/details/[source]/[id]',
    params: {
      source,
      id: encodeURIComponent(id),
    },
  });
}
