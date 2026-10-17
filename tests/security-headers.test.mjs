import test from 'node:test';
import assert from 'node:assert/strict';
import { contentSecurityPolicy, securityHeaders } from '../lib/server/security-headers.ts';
import { poolSize } from '../db/store.ts';

test('the production policy blocks framing and eval and allows the Clerk hosts', () => {
  const policy = contentSecurityPolicy({ development: false });
  assert.match(policy, /frame-ancestors 'none'/);
  assert.match(policy, /object-src 'none'/);
  assert.doesNotMatch(policy, /unsafe-eval/);
  assert.match(policy, /https:\/\/\*\.protect\.clerk\.com:\*/);
  assert.match(policy, /https:\/\/clerk-telemetry\.com/);
  assert.match(policy, /upgrade-insecure-requests/);
});

test('the development policy allows what the Next.js dev server needs', () => {
  const policy = contentSecurityPolicy({ development: true });
  assert.match(policy, /unsafe-eval/);
  assert.match(policy, /ws:/);
  assert.doesNotMatch(policy, /upgrade-insecure-requests/);
});

test('HSTS is sent only in production', () => {
  const names = (development) => securityHeaders({ development }).map((header) => header.key);
  assert.ok(names(false).includes('Strict-Transport-Security'));
  assert.ok(!names(true).includes('Strict-Transport-Security'));
  assert.ok(names(false).includes('X-Content-Type-Options'));
});

test('the pool size falls back to a safe value and is capped', () => {
  assert.equal(poolSize(undefined), 10);
  assert.equal(poolSize('abc'), 10);
  assert.equal(poolSize('0'), 10);
  assert.equal(poolSize('3'), 3);
  assert.equal(poolSize('500'), 20);
});
