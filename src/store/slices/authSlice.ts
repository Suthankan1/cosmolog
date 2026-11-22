import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { AuthUser, LoginFormData, RegisterFormData } from '../../services/auth/authSchemas';
import {
  AuthError,
  loginWithDummyJson,
  registerWithDummyJson,
  restoreUserSession,
} from '../../services/auth/dummyJsonAuth';
import { clearAuthTokens, getAuthToken } from '../../services/storage/secureStore';

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

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginFormData, { rejectWithValue }) => {
    try {
      const user = await loginWithDummyJson(credentials);
      return user;
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue('An unexpected error occurred during login.');
    }
  }
);

export const registerThunk = createAsyncThunk(
  'auth/register',
  async (formData: RegisterFormData, { rejectWithValue }) => {
    try {
      const result = await registerWithDummyJson(formData);
      return result;
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        return rejectWithValue(err.message);
      }
      return rejectWithValue('Registration failed. Please try again.');
    }
  }
);

export const restoreSessionThunk = createAsyncThunk(
  'auth/restoreSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        return null;
      }
      const user = await restoreUserSession(token);
      return user;
    } catch {
      return rejectWithValue('Failed to restore session');
    }
  }
);

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async () => {
    await clearAuthTokens();
  }
);

export const authSlice = createSlice({
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
    setAuthenticatedUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isInitialSessionLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = (action.payload as string) || 'Login failed';
      });

    // Register
    builder
      .addCase(registerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.registrationSuccess = false;
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.isLoading = false;
        state.registrationSuccess = true;
        state.error = null;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.registrationSuccess = false;
        state.error = (action.payload as string) || 'Registration failed';
      });

    // Restore Session
    builder
      .addCase(restoreSessionThunk.pending, (state) => {
        state.isInitialSessionLoading = true;
      })
      .addCase(restoreSessionThunk.fulfilled, (state, action) => {
        state.isInitialSessionLoading = false;
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(restoreSessionThunk.rejected, (state) => {
        state.isInitialSessionLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });

    // Logout
    builder.addCase(logoutThunk.fulfilled, (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isLoading = false;
    });
  },
});

export const { clearAuthError, resetRegistrationStatus, setAuthenticatedUser } = authSlice.actions;
export default authSlice.reducer;
