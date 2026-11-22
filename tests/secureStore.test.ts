import * as SecureStore from 'expo-secure-store';
import { clearSession, readStoredSession, replaceSessionIfCurrent, saveSession } from '../src/services/storage/secureStore';

jest.mock('expo-secure-store', () => {
  const values = new Map<string, string>();
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => { values.set(key, value); }),
    getItemAsync: jest.fn(async (key: string) => values.get(key) ?? null),
    deleteItemAsync: jest.fn(async (key: string) => { values.delete(key); }),
  };
});

const user = {
  id: 1, username: 'emilys', email: 'emily@example.com',
  firstName: 'Emily', lastName: 'Johnson', fullName: 'Emily Johnson',
};
const session = { user, accessToken: 'test-token', refreshToken: 'test-refresh' };

it('persists and restores a verified session through SecureStore', async () => {
  await saveSession(session);
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cosmolog_session_v1', JSON.stringify(session));
  expect(await readStoredSession()).toEqual({ kind: 'verified', session });
});

it('prevents a stale validation or leftover legacy token from restoring a signed-out session', async () => {
  await saveSession(session);
  await clearSession();
  await SecureStore.setItemAsync('cosmolog_access_token', session.accessToken);
  expect(await replaceSessionIfCurrent(session.accessToken, session)).toBe(false);
  expect(await readStoredSession()).toEqual({ kind: 'signedOut' });
});
