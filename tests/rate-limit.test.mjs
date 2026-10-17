import test from 'node:test';
import assert from 'node:assert/strict';
import { createRateLimiter } from '../lib/rate-limit.ts';

test('requests over the limit are refused until the window resets', () => {
  let clock = 1_000;
  const check = createRateLimiter({ limit: 2, windowMs: 10_000, now: () => clock });

  assert.deepEqual(check('a'), { allowed: true });
  assert.deepEqual(check('a'), { allowed: true });
  assert.deepEqual(check('a'), { allowed: false, retryAfterSeconds: 10 });

  clock += 4_200;
  assert.deepEqual(check('a'), { allowed: false, retryAfterSeconds: 6 });

  clock += 6_000;
  assert.deepEqual(check('a'), { allowed: true });
});

test('each key has its own budget', () => {
  const check = createRateLimiter({ limit: 1, windowMs: 1_000, now: () => 0 });
  assert.equal(check('a').allowed, true);
  assert.equal(check('b').allowed, true);
  assert.equal(check('a').allowed, false);
});

test('the key table stays bounded', () => {
  const check = createRateLimiter({ limit: 1, windowMs: 60_000, now: () => 0, maxKeys: 3 });
  for (const key of ['a', 'b', 'c', 'd', 'e']) assert.equal(check(key).allowed, true);
  // 'a' was evicted to make room, so it starts a fresh window.
  assert.equal(check('a').allowed, true);
});
