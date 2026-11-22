import { z } from 'zod';
import {
  AuthUser,
  authProfileSchema,
  dummyJsonLoginResponseSchema,
  LoginFormData,
  RegisterFormData,
} from './authSchemas';
import type { SecureSession } from '../storage/secureStore';
import { fetchJson, HttpError } from '../http';

const BASE_URL = 'https://dummyjson.com';
const registrationResponse = z.object({ id: z.number().int().positive() });
const tokenResponse = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
});

function post(path: string, body: object) {
  return fetchJson(BASE_URL + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function mapToAuthUser(data: z.infer<typeof authProfileSchema>): AuthUser {
  const { id, username, email, firstName, lastName, image } = data;
  return { id, username, email, firstName, lastName, image, fullName: (firstName + ' ' + lastName).trim() };
}

export async function loginWithDummyJson(credentials: LoginFormData): Promise<SecureSession> {
  const data = dummyJsonLoginResponseSchema.parse(await post('/auth/login', {
    username: credentials.username.trim(),
    password: credentials.password,
    expiresInMins: 60,
  }));
  return { user: mapToAuthUser(data), accessToken: data.accessToken, refreshToken: data.refreshToken };
}

export async function registerWithDummyJson(data: RegisterFormData): Promise<number> {
  const result = registrationResponse.parse(await post('/users/add', {
    username: data.username.trim(),
    password: data.password,
    firstName: data.firstName.trim(),
    email: data.email.trim(),
  }));
  return result.id;
}

async function fetchProfile(accessToken: string) {
  const data = await fetchJson(BASE_URL + '/auth/me', {
    headers: { Authorization: 'Bearer ' + accessToken },
  });
  return mapToAuthUser(authProfileSchema.parse(data));
}

function isAuthRejection(error: unknown): boolean {
  return error instanceof HttpError && (error.status === 401 || error.status === 403);
}

/** null means the server rejected access, including any available refresh token. */
export async function verifySession(tokens: Omit<SecureSession, 'user'>): Promise<SecureSession | null> {
  try {
    return { ...tokens, user: await fetchProfile(tokens.accessToken) };
  } catch (error) {
    if (!isAuthRejection(error)) throw error;
  }

  if (!tokens.refreshToken) return null;
  try {
    const refreshed = tokenResponse.parse(await post('/auth/refresh', {
      refreshToken: tokens.refreshToken,
      expiresInMins: 60,
    }));
    const user = await fetchProfile(refreshed.accessToken);
    return {
      user,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? tokens.refreshToken,
    };
  } catch (error) {
    if (isAuthRejection(error) || (error instanceof HttpError && error.status === 400)) return null;
    throw error;
  }
}

export function authErrorMessage(error: unknown, isLogin: boolean): string {
  if (error instanceof HttpError) {
    if (isLogin && [400, 401, 403].includes(error.status)) return 'Invalid username or password.';
    return 'The account service is unavailable. Try again shortly.';
  }
  if (error instanceof z.ZodError) return 'The account service sent an invalid response.';
  return 'Could not reach the account service. Check your connection and retry.';
}
