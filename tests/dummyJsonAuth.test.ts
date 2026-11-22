import {
  AuthError,
  loginWithDummyJson,
  mapToAuthUser,
  registerWithDummyJson,
  restoreUserSession,
} from '../src/services/auth/dummyJsonAuth';
import * as SecureStoreModule from '../src/services/storage/secureStore';

jest.mock('../src/services/storage/secureStore', () => ({
  saveAuthTokens: jest.fn(),
  getAuthToken: jest.fn(),
  getRefreshToken: jest.fn(),
  clearAuthTokens: jest.fn(),
}));

describe('DummyJSON Auth Service', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('mapToAuthUser', () => {
    it('correctly maps raw API user into domain AuthUser with full name', () => {
      const user = mapToAuthUser({
        id: 1,
        username: 'emilys',
        email: 'emily.johnson@x.dummyjson.com',
        firstName: 'Emily',
        lastName: 'Johnson',
        image: 'https://dummyjson.com/icon/emilys/128',
      });

      expect(user.fullName).toBe('Emily Johnson');
      expect(user.username).toBe('emilys');
      expect(user.id).toBe(1);
    });
  });

  describe('loginWithDummyJson', () => {
    it('saves tokens to SecureStore and returns mapped user on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          id: 1,
          username: 'emilys',
          email: 'emily.johnson@x.dummyjson.com',
          firstName: 'Emily',
          lastName: 'Johnson',
          accessToken: 'valid_jwt_access_token',
          refreshToken: 'valid_jwt_refresh_token',
        }),
      });

      const user = await loginWithDummyJson({ username: 'emilys', password: 'emilyspass' });

      expect(user.username).toBe('emilys');
      expect(user.fullName).toBe('Emily Johnson');
      expect(SecureStoreModule.saveAuthTokens).toHaveBeenCalledWith(
        'valid_jwt_access_token',
        'valid_jwt_refresh_token'
      );
    });

    it('throws INVALID_CREDENTIALS error on 400 response', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(
        loginWithDummyJson({ username: 'baduser', password: 'badpassword' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('throws NETWORK_ERROR on connection failure', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network request failed'));

      await expect(
        loginWithDummyJson({ username: 'emilys', password: 'emilyspass' })
      ).rejects.toThrow(AuthError);
    });
  });

  describe('registerWithDummyJson', () => {
    it('returns simulated registration ID upon successful POST /users/add', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ id: 209 }),
      });

      const result = await registerWithDummyJson({
        firstName: 'Arthur',
        username: 'arthurd',
        email: 'arthur@cosmolog.org',
        password: 'Password123',
        confirmPassword: 'Password123',
      });

      expect(result.id).toBe(209);
      expect(result.message).toContain('Simulated account created');
    });
  });

  describe('restoreUserSession', () => {
    it('clears secure tokens and returns null when token is invalid or 401', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
      });

      const user = await restoreUserSession('expired_token');
      expect(user).toBeNull();
      expect(SecureStoreModule.clearAuthTokens).toHaveBeenCalled();
    });
  });
});
