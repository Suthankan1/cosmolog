import {
  AuthUser,
  dummyJsonLoginResponseSchema,
  LoginFormData,
  RegisterFormData,
} from './authSchemas';
import { clearAuthTokens, saveAuthTokens } from '../storage/secureStore';

export class AuthError extends Error {
  constructor(message: string, public readonly code: 'INVALID_CREDENTIALS' | 'NETWORK_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN') {
    super(message);
    this.name = 'AuthError';
  }
}

const DUMMY_JSON_BASE_URL = 'https://dummyjson.com';

/**
 * Maps a DummyJSON user payload to our domain AuthUser object.
 */
export function mapToAuthUser(data: {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  image?: string;
}): AuthUser {
  return {
    id: data.id,
    username: data.username,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    fullName: `${data.firstName} ${data.lastName}`.trim(),
    image: data.image,
  };
}

/**
 * Authenticates user against DummyJSON and securely stores access tokens.
 */
export async function loginWithDummyJson(credentials: LoginFormData): Promise<AuthUser> {
  let response: Response;
  try {
    response = await fetch(`${DUMMY_JSON_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: credentials.username.trim(),
        password: credentials.password,
        expiresInMins: 60,
      }),
    });
  } catch {
    throw new AuthError('Unable to connect. Please verify your internet connection.', 'NETWORK_ERROR');
  }

  if (response.status === 400 || response.status === 401) {
    let errorMsg = 'Invalid username or password.';
    try {
      const errJson = await response.json();
      if (errJson?.message) {
        errorMsg = errJson.message;
      }
    } catch {}
    throw new AuthError(errorMsg, 'INVALID_CREDENTIALS');
  }

  if (!response.ok) {
    throw new AuthError(`Authentication server error (${response.status})`, 'UNKNOWN');
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new AuthError('Failed to parse authentication response.', 'VALIDATION_ERROR');
  }

  const parsed = dummyJsonLoginResponseSchema.safeParse(json);
  if (!parsed.success) {
    throw new AuthError('Authentication response validation failed.', 'VALIDATION_ERROR');
  }

  // Store token strictly in OS-backed SecureStore
  await saveAuthTokens(parsed.data.accessToken, parsed.data.refreshToken);

  return mapToAuthUser(parsed.data);
}

/**
 * Simulates user registration via DummyJSON POST /users/add.
 */
export async function registerWithDummyJson(formData: RegisterFormData): Promise<{ id: number; message: string }> {
  let response: Response;
  try {
    response = await fetch(`${DUMMY_JSON_BASE_URL}/users/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: formData.username.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        email: formData.email.trim(),
      }),
    });
  } catch {
    throw new AuthError('Unable to connect to registration service.', 'NETWORK_ERROR');
  }

  if (!response.ok) {
    throw new AuthError(`Registration failed with status ${response.status}`, 'UNKNOWN');
  }

  const data = await response.json();
  return {
    id: data.id || 209,
    message: 'Simulated account created successfully.',
  };
}

/**
 * Restores user session using token stored in SecureStore.
 */
export async function restoreUserSession(token: string): Promise<AuthUser | null> {
  try {
    const response = await fetch(`${DUMMY_JSON_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 || response.status === 403) {
      await clearAuthTokens();
      return null;
    }

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return mapToAuthUser(data);
  } catch {
    return null;
  }
}
