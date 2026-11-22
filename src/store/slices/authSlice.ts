import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppThunk } from '..';
import type { AuthUser, LoginFormData, RegisterFormData } from '../../services/auth/authSchemas';
import {
  authErrorMessage,
  loginWithDummyJson,
  registerWithDummyJson,
  verifySession,
} from '../../services/auth/dummyJsonAuth';
import { getNetworkState } from '../../services/network/networkObserver';
import { clearSession, readStoredSession, replaceSessionIfCurrent, saveSession } from '../../services/storage/secureStore';

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitialSessionLoading: boolean;
  isLoading: boolean;
  error: string | null;
  registrationSuccess: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isInitialSessionLoading: true,
  isLoading: false,
  error: null,
  registrationSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    resetRegistrationStatus(state) {
      state.registrationSuccess = false;
      state.error = null;
    },
    operationStarted(state) {
      state.isLoading = true;
      state.error = null;
    },
    operationFailed(state, action: PayloadAction<string>) {
      state.isInitialSessionLoading = false;
      state.isLoading = false;
      state.error = action.payload;
    },
    registrationCompleted(state) {
      state.isLoading = false;
      state.registrationSuccess = true;
    },
    sessionChanged(_state, action: PayloadAction<AuthUser | null>) {
      return {
        ...initialState,
        user: action.payload,
        isAuthenticated: Boolean(action.payload),
        isInitialSessionLoading: false,
      };
    },
  },
});

export const { clearAuthError, resetRegistrationStatus, sessionChanged } = authSlice.actions;
const { operationStarted, operationFailed, registrationCompleted } = authSlice.actions;

export const loginThunk = (credentials: LoginFormData): AppThunk<Promise<void>> => async (dispatch, getState) => {
  if (getState().auth.isLoading) return;
  dispatch(operationStarted());
  let session;
  try {
    session = await loginWithDummyJson(credentials);
  } catch (error) {
    dispatch(operationFailed(authErrorMessage(error, true)));
    return;
  }
  try {
    await saveSession(session);
    dispatch(sessionChanged(session.user));
  } catch {
    dispatch(operationFailed('Could not save your secure session. Try signing in again.'));
  }
};

export const registerThunk = (data: RegisterFormData): AppThunk<Promise<void>> => async (dispatch, getState) => {
  if (getState().auth.isLoading) return;
  dispatch(operationStarted());
  try {
    await registerWithDummyJson(data);
    dispatch(registrationCompleted());
  } catch (error) {
    dispatch(operationFailed(authErrorMessage(error, false)));
  }
};

export const restoreSessionThunk = (): AppThunk<Promise<void>> => async (dispatch) => {
  try {
    const stored = await readStoredSession();
    if (stored.kind === 'verified') {
      dispatch(sessionChanged(stored.session.user));
      return;
    }
    if (stored.kind === 'legacy') {
      if ((await getNetworkState()) !== 'online') {
        dispatch(operationFailed('Connect to upgrade your saved session, then sign in if requested.'));
        return;
      }
      const session = await verifySession(stored);
      await replaceSessionIfCurrent(stored.accessToken, session);
      dispatch(sessionChanged(session?.user ?? null));
      return;
    }
    dispatch(sessionChanged(null));
  } catch {
    dispatch(operationFailed('Could not restore your session. Reconnect and try again.'));
  }
};

let checking = false;
export const revalidateSessionThunk = (): AppThunk<Promise<void>> => async (dispatch, getState) => {
  if (checking || !getState().auth.isAuthenticated || getState().auth.isLoading) return;
  checking = true;
  try {
    const stored = await readStoredSession();
    if (stored.kind !== 'verified') return;
    const session = await verifySession(stored.session);
    if (session && session.user.id !== stored.session.user.id) return;
    if (session && JSON.stringify(session) === JSON.stringify(stored.session)) return;
    if (getState().auth.isLoading || getState().auth.user?.id !== stored.session.user.id) return;
    if (await replaceSessionIfCurrent(stored.session.accessToken, session)) {
      if (!getState().auth.isLoading) dispatch(sessionChanged(session?.user ?? null));
    }
  } catch {
    // A transport or storage failure does not revoke a previously verified local session.
  } finally {
    checking = false;
  }
};

export const logoutThunk = (): AppThunk<Promise<void>> => async (dispatch, getState) => {
  if (getState().auth.isLoading) return;
  dispatch(operationStarted());
  try {
    await clearSession();
    dispatch(sessionChanged(null));
  } catch {
    dispatch(operationFailed('Could not sign out securely. Try again.'));
  }
};

export default authSlice.reducer;
