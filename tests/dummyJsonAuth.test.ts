import { loginWithDummyJson, registerWithDummyJson, verifySession } from '../src/services/auth/dummyJsonAuth';

const profile = {
  id: 1, username: 'emilys', email: 'emily@example.com', firstName: 'Emily', lastName: 'Johnson',
};
const originalFetch = global.fetch;

function response(status: number, payload?: unknown) {
  return { status, ok: status < 300, json: async () => payload };
}

afterEach(() => { global.fetch = originalFetch; });

it('validates and maps a successful login response', async () => {
  global.fetch = jest.fn().mockResolvedValue(response(200, { ...profile, accessToken: 'test-access' }));
  const result = await loginWithDummyJson({ username: 'emilys', password: 'test-password' });
  expect(result.user.fullName).toBe('Emily Johnson');
  expect(result.accessToken).toBe('test-access');
});

it('rejects a malformed registration response', async () => {
  global.fetch = jest.fn().mockResolvedValue(response(201, {}));
  await expect(registerWithDummyJson({
    firstName: 'Arthur', username: 'arthur', email: 'arthur@example.com',
    password: 'Testpass1', confirmPassword: 'Testpass1',
  })).rejects.toThrow();
});

it('refreshes an expired access token before revalidating the profile', async () => {
  global.fetch = jest.fn()
    .mockResolvedValueOnce(response(401))
    .mockResolvedValueOnce(response(200, { accessToken: 'new-token' }))
    .mockResolvedValueOnce(response(200, profile));
  const result = await verifySession({ accessToken: 'expired', refreshToken: 'test-refresh' });
  expect(result?.accessToken).toBe('new-token');
  expect(global.fetch).toHaveBeenNthCalledWith(2, 'https://dummyjson.com/auth/refresh', expect.objectContaining({ method: 'POST' }));
});

it('distinguishes temporary service failure from a decisive rejection', async () => {
  global.fetch = jest.fn().mockResolvedValueOnce(response(503)).mockResolvedValueOnce(response(401));
  await expect(verifySession({ accessToken: 'test-access' })).rejects.toMatchObject({ status: 503 });
  await expect(verifySession({ accessToken: 'test-access' })).resolves.toBeNull();
});
