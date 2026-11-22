import * as FileSystem from 'expo-file-system/legacy';

const IMAGES_DIRECTORY = `${FileSystem.documentDirectory || ''}cosmolog_images/`;

let isDirCreated = false;

async function ensureDirectoryExists(): Promise<void> {
  if (isDirCreated) return;
  try {
    const dirInfo = await FileSystem.getInfoAsync(IMAGES_DIRECTORY);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(IMAGES_DIRECTORY, { intermediates: true });
    }
    isDirCreated = true;
  } catch {
    // Filesystem may be restricted in some mock test runners
  }
}

/**
 * Downloads a remote image to local app storage for guaranteed offline access.
 * Returns the local file URI, or null on network/download failure.
 */
export async function persistImageLocally(
  remoteUrl: string,
  localId: string
): Promise<string | null> {
  if (!remoteUrl || !remoteUrl.startsWith('http')) {
    return null;
  }

  try {
    await ensureDirectoryExists();

    const sanitizedId = localId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const extension = remoteUrl.includes('.webp')
      ? '.webp'
      : remoteUrl.includes('.png')
      ? '.png'
      : '.jpg';
    const localUri = `${IMAGES_DIRECTORY}${sanitizedId}${extension}`;

    const downloadResult = await FileSystem.downloadAsync(remoteUrl, localUri);
    if (downloadResult.status === 200) {
      return downloadResult.uri;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Deletes a previously stored local image file.
 */
export async function deleteLocalImage(localUri: string): Promise<void> {
  try {
    const info = await FileSystem.getInfoAsync(localUri);
    if (info.exists) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    }
  } catch {}
}
