import * as SecureStore from 'expo-secure-store';
import {
  clearAuthTokens,
  getAuthToken,
  getRefreshToken,
  saveAuthTokens,
} from '../src/services/storage/secureStore';

jest.mock('expo-secure-store', () => {
  const store: Record<string, string> = {};
  return {
    setItemAsync: jest.fn(async (key: string, value: string) => {
      store[key] = value;
    }),
    getItemAsync: jest.fn(async (key: string) => store[key] || null),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
  };
});

describe('SecureStore Authentication Storage', () => {
  beforeEach(async () => {
    await clearAuthTokens();
    jest.clearAllMocks();
  });

  it('persists access and refresh tokens to OS-backed secure storage', async () => {
    await saveAuthTokens('access_token_123', 'refresh_token_456');

    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cosmolog_access_token', 'access_token_123');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('cosmolog_refresh_token', 'refresh_token_456');

    const token = await getAuthToken();
    const refreshToken = await getRefreshToken();

    expect(token).toBe('access_token_123');
    expect(refreshToken).toBe('refresh_token_456');
  });

  it('clears all tokens completely upon logout', async () => {
    await saveAuthTokens('token_to_clear');
    expect(await getAuthToken()).toBe('token_to_clear');

    await clearAuthTokens();

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cosmolog_access_token');
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('cosmolog_refresh_token');
    expect(await getAuthToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
  });
});
