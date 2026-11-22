import { configureStore, type Middleware } from '@reduxjs/toolkit';
import auth, { loginThunk, logoutThunk, restoreSessionThunk, revalidateSessionThunk } from '../src/store/slices/authSlice';
import * as api from '../src/services/auth/dummyJsonAuth';
import * as secure from '../src/services/storage/secureStore';

jest.mock('../src/services/auth/dummyJsonAuth');
jest.mock('../src/services/storage/secureStore');
jest.mock('../src/services/network/networkObserver', () => ({ getNetworkState: jest.fn() }));

const user = {
  id: 1, username: 'emilys', email: 'emily@example.com',
  firstName: 'Emily', lastName: 'Johnson', fullName: 'Emily Johnson',
};
const session = { user, accessToken: 'test-token' };

function setup() {
  const actions: unknown[] = [];
  const capture: Middleware = () => (next) => (action) => {
    actions.push(action);
    return next(action);
  };
  const store = configureStore({ reducer: { auth }, middleware: (defaults) => defaults().concat(capture) });
  const dispatch = store.dispatch as unknown as import('../src/store').AppDispatch;
  return { store, dispatch, actions };
}

beforeEach(() => jest.resetAllMocks());

it('opens a verified local session without making a network request', async () => {
  jest.mocked(secure.readStoredSession).mockResolvedValue({ kind: 'verified', session });
  const { dispatch, store } = setup();
  await dispatch(restoreSessionThunk());
  expect(store.getState().auth.user).toEqual(user);
  expect(api.verifySession).not.toHaveBeenCalled();
});

it('keeps a verified local session through a temporary validation failure', async () => {
  jest.mocked(secure.readStoredSession).mockResolvedValue({ kind: 'verified', session });
  jest.mocked(api.verifySession).mockRejectedValue(new Error('network'));
  const { dispatch, store } = setup();
  await dispatch(restoreSessionThunk());
  await dispatch(revalidateSessionThunk());
  expect(store.getState().auth.isAuthenticated).toBe(true);
  expect(secure.replaceSessionIfCurrent).not.toHaveBeenCalled();
});

it('keeps passwords and access tokens out of Redux actions', async () => {
  jest.mocked(api.loginWithDummyJson).mockResolvedValue(session);
  const { dispatch, actions } = setup();
  await dispatch(loginThunk({ username: 'emilys', password: 'test-password' }));
  expect(secure.saveSession).toHaveBeenCalledWith(session);
  expect(JSON.stringify(actions)).not.toMatch(/test-password|test-token/);
});

it('shows a failed sign-out and keeps the session until the retry succeeds', async () => {
  jest.mocked(secure.readStoredSession).mockResolvedValue({ kind: 'verified', session });
  jest.mocked(secure.clearSession).mockRejectedValueOnce(new Error('storage')).mockResolvedValueOnce();
  const { dispatch, store } = setup();
  await dispatch(restoreSessionThunk());
  await dispatch(logoutThunk());
  expect(store.getState().auth.user).toEqual(user);
  expect(store.getState().auth.error).toMatch(/sign out/i);
  await dispatch(logoutThunk());
  expect(store.getState().auth.user).toBeNull();
});
