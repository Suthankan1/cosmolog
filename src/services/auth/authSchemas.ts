import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z.string().trim().min(1, 'First name is required'),
    username: z
      .string()
      .trim()
      .min(3, 'Username must be at least 3 characters')
      .regex(/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, and . - _'),
    email: z.string().trim().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const authProfileSchema = z.object({
  id: z.number().int().positive(),
  username: z.string().min(1),
  email: z.email(),
  firstName: z.string().min(1),
  lastName: z.string(),
  image: z.url({ protocol: /^https$/ }).optional().catch(undefined),
});

export const authUserSchema = authProfileSchema.extend({ fullName: z.string().min(1) });

export const dummyJsonLoginResponseSchema = authProfileSchema.extend({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1).optional(),
});

export type AuthUser = z.infer<typeof authUserSchema>;
