import authReducer, {
  clearAuthError,
  loginThunk,
  logoutThunk,
  setAuthenticatedUser,
} from '../src/store/slices/authSlice';

jest.mock('../src/services/auth/dummyJsonAuth');
jest.mock('../src/services/storage/secureStore');

describe('AuthSlice State Transitions', () => {
  const initialAuthState = {
    user: null,
    isAuthenticated: false,
    isInitialSessionLoading: true,
    isLoading: false,
    error: null,
    registrationSuccess: false,
  };

  it('handles setAuthenticatedUser correctly', () => {
    const user = {
      id: 1,
      username: 'emilys',
      email: 'emily@example.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      fullName: 'Emily Johnson',
    };
    const state = authReducer(initialAuthState, setAuthenticatedUser(user));
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.isInitialSessionLoading).toBe(false);
  });

  it('handles clearAuthError action', () => {
    const stateWithError = { ...initialAuthState, error: 'Previous error' };
    const state = authReducer(stateWithError, clearAuthError());
    expect(state.error).toBeNull();
  });

  it('handles loginThunk.fulfilled lifecycle', () => {
    const user = {
      id: 1,
      username: 'emilys',
      email: 'emily@example.com',
      firstName: 'Emily',
      lastName: 'Johnson',
      fullName: 'Emily Johnson',
    };
    const action = { type: loginThunk.fulfilled.type, payload: user };
    const state = authReducer(initialAuthState, action);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toEqual(user);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('handles loginThunk.rejected lifecycle', () => {
    const action = { type: loginThunk.rejected.type, payload: 'Invalid credentials' };
    const state = authReducer(initialAuthState, action);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  it('handles logoutThunk.fulfilled lifecycle by clearing session', () => {
    const loggedInState = {
      ...initialAuthState,
      isAuthenticated: true,
      user: {
        id: 1,
        username: 'emilys',
        email: 'emily@example.com',
        firstName: 'Emily',
        lastName: 'Johnson',
        fullName: 'Emily Johnson',
      },
    };
    const action = { type: logoutThunk.fulfilled.type };
    const state = authReducer(loggedInState, action);
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
  });
});
