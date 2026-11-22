# Task 01 — DummyJSON authentication

## Scope
Login, simulated registration, secure token storage, auth gate and logout.

## Requirements
- DummyJSON login endpoint.
- Registration simulation with clear disclosure.
- Zod + React Hook Form validation.
- SecureStore for token only.
- Never log passwords/tokens.
- Logout clears secure session and Redux auth state.
- Loading, invalid credentials, network error and validation states.

## Tests
- Input validation.
- Auth service response mapping.
- Secure session clear behaviour using mocked SecureStore.

## Acceptance
A valid demo user can log in, name appears in profile/header, app session is handled safely, logout returns to auth screen.
