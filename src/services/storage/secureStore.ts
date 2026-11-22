import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'cosmolog_access_token';
const REFRESH_TOKEN_KEY = 'cosmolog_refresh_token';

/**
 * Stores authentication tokens securely using OS-backed secure storage.
 * Per assignment requirements, tokens are never stored in AsyncStorage,
 * MMKV, SQLite, or plain Redux persistence.
 */
export async function saveAuthTokens(accessToken: string, refreshToken?: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/**
 * Retrieves the stored access token from secure storage.
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Retrieves the stored refresh token from secure storage.
 */
export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Clears all authentication tokens from secure storage upon logout.
 */
export async function clearAuthTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  } catch {}
  try {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch {}
}
