import * as SecureStore from 'expo-secure-store';
import { z } from 'zod';
import { authUserSchema } from '../auth/authSchemas';

const SESSION_KEY = 'cosmolog_session_v1';
const OLD_ACCESS_KEY = 'cosmolog_access_token';
const OLD_REFRESH_KEY = 'cosmolog_refresh_token';
const SIGNED_OUT = 'signed-out';

const sessionSchema = z.object({
  user: authUserSchema,
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
});

export type SecureSession = z.infer<typeof sessionSchema>;
export type StoredSession =
  | { kind: 'verified'; session: SecureSession }
  | { kind: 'legacy'; accessToken: string; refreshToken?: string }
  | { kind: 'signedOut' };

let writes: Promise<unknown> = Promise.resolve();

function writeSession<T>(operation: () => Promise<T>): Promise<T> {
  const result = writes.then(operation);
  writes = result.catch(() => undefined);
  return result;
}

export async function readStoredSession(): Promise<StoredSession> {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (value === SIGNED_OUT) return { kind: 'signedOut' };
  if (value) return { kind: 'verified', session: sessionSchema.parse(JSON.parse(value)) };
  const accessToken = await SecureStore.getItemAsync(OLD_ACCESS_KEY);
  if (!accessToken) return { kind: 'signedOut' };
  const refreshToken = await SecureStore.getItemAsync(OLD_REFRESH_KEY);
  return { kind: 'legacy', accessToken, refreshToken: refreshToken || undefined };
}

async function removeLegacyTokens() {
  // The new record takes precedence even when cleanup of an old key fails.
  await Promise.allSettled([
    SecureStore.deleteItemAsync(OLD_ACCESS_KEY),
    SecureStore.deleteItemAsync(OLD_REFRESH_KEY),
  ]);
}

export function saveSession(session: SecureSession): Promise<void> {
  return writeSession(async () => {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
    await removeLegacyTokens();
  });
}

export function clearSession(): Promise<void> {
  return writeSession(async () => {
    await SecureStore.setItemAsync(SESSION_KEY, SIGNED_OUT);
    await removeLegacyTokens();
  });
}

export function replaceSessionIfCurrent(
  accessToken: string,
  next: SecureSession | null
): Promise<boolean> {
  return writeSession(async () => {
    const current = await readStoredSession();
    if (current.kind === 'signedOut') return false;
    const currentToken = current.kind === 'verified' ? current.session.accessToken : current.accessToken;
    if (currentToken !== accessToken) return false;
    await SecureStore.setItemAsync(SESSION_KEY, next ? JSON.stringify(next) : SIGNED_OUT);
    await removeLegacyTokens();
    return true;
  });
}
