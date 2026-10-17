import test, { afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { authenticatedUserId, isClerkConfigured } from '../lib/auth.ts';

const keys = ['AUTH_MODE', 'NODE_ENV', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
const original = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

function setEnv(values) {
  for (const key of keys) {
    if (key in values) process.env[key] = values[key];
    else delete process.env[key];
  }
}

afterEach(() => {
  for (const key of keys) {
    if (original[key] === undefined) delete process.env[key];
    else process.env[key] = original[key];
  }
  delete globalThis.__testUserId;
});

test('demo mode signs in a fixed local user outside production', async () => {
  setEnv({ AUTH_MODE: 'demo', NODE_ENV: 'development' });
  assert.equal(await authenticatedUserId(), 'local-demo-user');
});

test('demo mode refuses to authenticate in production', async () => {
  setEnv({ AUTH_MODE: 'demo', NODE_ENV: 'production' });
  assert.equal(await authenticatedUserId(), null);
});

test('without Clerk keys nobody is signed in', async () => {
  setEnv({ AUTH_MODE: 'clerk', NODE_ENV: 'production' });
  assert.equal(isClerkConfigured(), false);
  assert.equal(await authenticatedUserId(), null);
});

test('with Clerk keys the session user id is used', async () => {
  setEnv({
    AUTH_MODE: 'clerk',
    NODE_ENV: 'production',
    CLERK_SECRET_KEY: 'sk_test_placeholder',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_placeholder',
  });
  assert.equal(isClerkConfigured(), true);
  globalThis.__testUserId = 'user_abc';
  assert.equal(await authenticatedUserId(), 'user_abc');
  globalThis.__testUserId = null;
  assert.equal(await authenticatedUserId(), null);
});
