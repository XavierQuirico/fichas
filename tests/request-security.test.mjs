import test from 'node:test';
import assert from 'node:assert/strict';
import { isSameOriginMutation } from '../lib/server/request-security.ts';

test('mutations accept only the request origin', () => {
  const url = 'https://fichas.example/api/workspace';
  assert.equal(
    isSameOriginMutation(
      new Request(url, { method: 'PUT', headers: { origin: 'https://fichas.example' } }),
    ),
    true,
  );
  assert.equal(
    isSameOriginMutation(
      new Request(url, { method: 'PUT', headers: { referer: 'https://fichas.example/editor' } }),
    ),
    true,
  );
  assert.equal(
    isSameOriginMutation(
      new Request(url, { method: 'PUT', headers: { origin: 'https://attacker.example' } }),
    ),
    false,
  );
  assert.equal(isSameOriginMutation(new Request(url, { method: 'PUT' })), false);
});
