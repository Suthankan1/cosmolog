import { loginSchema, registerSchema } from '../src/services/auth/authSchemas';

describe('Authentication Form Validation', () => {
  describe('loginSchema', () => {
    it('rejects blank username and password', () => {
      const result = loginSchema.safeParse({ username: '', password: '' });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.username).toContain('Username is required');
        expect(errors.password).toContain('Password is required');
      }
    });

    it('accepts trimmed non-empty credentials', () => {
      const result = loginSchema.safeParse({
        username: ' emilys ',
        password: 'emilyspass',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('emilys');
      }
    });
  });

  describe('registerSchema', () => {
    it('enforces minimum lengths and valid email', () => {
      const result = registerSchema.safeParse({
        firstName: '',
        username: 'ab',
        email: 'not-an-email',
        password: '123',
        confirmPassword: '123',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.firstName).toContain('First name is required');
        expect(errors.username).toContain('Username must be at least 3 characters');
        expect(errors.email).toContain('Please enter a valid email address');
        expect(errors.password).toContain('Password must be at least 6 characters');
      }
    });

    it('rejects mismatched passwords', () => {
      const result = registerSchema.safeParse({
        firstName: 'Arthur',
        username: 'arthurd',
        email: 'arthur@cosmolog.org',
        password: 'Password123',
        confirmPassword: 'DifferentPassword456',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const errors = result.error.flatten().fieldErrors;
        expect(errors.confirmPassword).toContain('Passwords do not match');
      }
    });

    it('accepts valid registration payload', () => {
      const result = registerSchema.safeParse({
        firstName: 'Arthur',
        username: 'arthurd',
        email: 'arthur@cosmolog.org',
        password: 'Password123',
        confirmPassword: 'Password123',
      });
      expect(result.success).toBe(true);
    });
  });
});
