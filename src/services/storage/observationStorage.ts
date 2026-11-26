/**
 * App-Private Observation Photo Storage Service (F05)
 *
 * Stores user-captured telescope/eyepiece observation photographs in an
 * app-private directory isolated from public caches and API media downloads.
 * Photographs are never conflated with licensed NASA APOD or Spaceflight News media.
 */

import { Directory, File, Paths } from 'expo-file-system';

const MAX_OBSERVATION_PHOTO_BYTES = 12 * 1024 * 1024; // 12 MB limit

export function getObservationsDirectory(): Directory {
  const dir = new Directory(Paths.document, 'cosmolog_observations');
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

export function getObservationPhotoFile(fileName: string): File | null {
  if (!/^[\w-]+\.(jpg|jpeg|png|webp)$/i.test(fileName)) {
    return null;
  }
  return new File(getObservationsDirectory(), fileName);
}

/**
 * Copies a selected user photo from temporary picker cache into durable app-private storage.
 */
export async function stageObservationPhoto(
  sourceUri: string,
): Promise<{ fileName: string; bytes: number; uri: string }> {
  const dir = getObservationsDirectory();
  const extMatch = sourceUri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
  const ext = (extMatch ? extMatch[1].toLowerCase() : 'jpg').replace('jpeg', 'jpg');
  const validExt = ['jpg', 'png', 'webp'].includes(ext) ? ext : 'jpg';

  const fileName = `obs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${validExt}`;
  const targetFile = new File(dir, fileName);

  const sourceFile = new File(sourceUri);
  if (!sourceFile.exists) {
    throw new Error('Selected observation image file does not exist');
  }

  const bytes = sourceFile.size;
  if (bytes <= 0 || bytes > MAX_OBSERVATION_PHOTO_BYTES) {
    throw new Error('Observation image must be non-empty and under 12 MB');
  }

  // Copy into persistent private directory
  sourceFile.copy(targetFile);

  return {
    fileName,
    bytes,
    uri: targetFile.uri,
  };
}

/**
 * Retrieves the local absolute URI for an observation photo, or null if missing/invalid.
 */
export function getObservationPhotoUri(fileName: string | null): string | null {
  if (!fileName) return null;
  const file = getObservationPhotoFile(fileName);
  if (!file || !file.exists) return null;
  return file.uri;
}

/**
 * Permanently removes a private observation photo file upon observation deletion.
 */
export function deleteObservationPhotoFile(fileName: string | null): boolean {
  if (!fileName) return false;
  try {
    const file = getObservationPhotoFile(fileName);
    if (file && file.exists) {
      file.delete();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
