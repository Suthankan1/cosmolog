import { fetch } from 'expo/fetch';
import { Directory, File, Paths } from 'expo-file-system';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const extensions: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
};

function imageDirectory() {
  return new Directory(Paths.document, 'cosmolog_images');
}

function imageFile(name: string) {
  if (!/^[\w-]+\.(jpg|png|gif|webp|part)$/.test(name)) return null;
  return new File(imageDirectory(), name);
}

function isImageHeader(data: Uint8Array, extension: string) {
  switch (extension) {
    case 'jpg': return data[0] === 255 && data[1] === 216 && data[2] === 255;
    case 'png': return data[0] === 137 && data[1] === 80 && data[2] === 78 && data[3] === 71;
    case 'gif': return String.fromCharCode(...data.slice(0, 6)) === 'GIF89a' ||
      String.fromCharCode(...data.slice(0, 6)) === 'GIF87a';
    case 'webp': return String.fromCharCode(...data.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...data.slice(8, 12)) === 'WEBP';
    default: return false;
  }
}

export function getLocalImage(name: string | null): { uri: string; bytes: number } | null {
  if (!name) return null;
  const file = imageFile(name);
  if (!file) return null;
  try {
    const bytes = file.size;
    if (!file.exists || bytes <= 0 || bytes > MAX_IMAGE_BYTES) return null;
    const handle = file.open();
    try {
      return isImageHeader(handle.readBytesSync(Math.min(bytes, 12)), file.extension.slice(1))
        ? { uri: file.uri, bytes } : null;
    } finally {
      handle.close();
    }
  } catch {
    return null;
  }
}

export function pruneImageFiles(keep: Set<string>) {
  const dir = imageDirectory();
  if (!dir.exists) return;
  for (const entry of dir.list()) {
    if (entry instanceof File && imageFile(entry.name) && !keep.has(entry.name)) entry.delete();
  }
}

export function deleteImageFile(name: string) {
  const file = imageFile(name);
  if (file?.exists) file.delete();
}

export async function downloadImage(url: string, id: string, signal: AbortSignal) {
  if (new URL(url).protocol !== 'https:') throw new Error('Unsupported image URL');
  const dir = imageDirectory();
  dir.create({ idempotent: true, intermediates: true });
  const key = id.replace(/[^\w-]/g, '_') + '_' + Date.now();
  const temporary = new File(dir, key + '.part');
  const response = await fetch(url, { signal });
  const type = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() ?? '';
  const extension = extensions[type];
  const length = Number(response.headers.get('content-length'));
  if (!response.ok || !extension || length > MAX_IMAGE_BYTES || !response.body) {
    throw new Error('Image response is unavailable or unsupported');
  }

  const reader = response.body.getReader();
  const header = new Uint8Array(12);
  let bytes = 0;
  try {
    temporary.create();
    const handle = temporary.open();
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        if (bytes + chunk.value.byteLength > MAX_IMAGE_BYTES) throw new Error('Image is too large');
        if (bytes < header.length) header.set(chunk.value.subarray(0, header.length - bytes), bytes);
        bytes += chunk.value.byteLength;
        await handle.writeBytes(chunk.value);
      }
    } finally {
      handle.close();
    }

    if (bytes < 12 || !isImageHeader(header, extension) || signal.aborted) {
      throw new Error('Image is incomplete or invalid');
    }
    const target = new File(dir, key + '.' + extension);
    await temporary.move(target);
    return { fileName: target.name, bytes };
  } catch (error) {
    if (temporary.exists) temporary.delete();
    throw error;
  } finally {
    void reader.cancel().catch(() => {});
  }
}
