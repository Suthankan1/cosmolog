import type { MediaStatus } from '../../database/repositories/favouritesRepository';

export function mediaLabel(status: MediaStatus, offline: boolean) {
  switch (status) {
    case 'ready': return 'Image available offline';
    case 'waiting': return offline ? 'Image waiting for connection' : 'Image download pending';
    case 'failed': return 'Text available offline · Image download failed';
    case 'text-only': return 'Text available offline';
  }
}
