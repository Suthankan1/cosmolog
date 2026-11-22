export class HttpError extends Error {
  constructor(public readonly status: number) {
    super('Request failed');
  }
}

export async function fetchJson(url: string, options?: RequestInit): Promise<unknown> {
  const controller = new AbortController();
  const upstream = options?.signal;
  const abort = () => controller.abort();
  if (upstream?.aborted) abort();
  upstream?.addEventListener('abort', abort);
  const timer = setTimeout(abort, 10_000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new HttpError(response.status);
    return await response.json();
  } finally {
    clearTimeout(timer);
    upstream?.removeEventListener('abort', abort);
  }
}
