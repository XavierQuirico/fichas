import test from 'node:test';
import assert from 'node:assert/strict';
import {
  workspacePayloadSchema,
  fontsPayloadSchema,
  archivePayloadSchema,
} from '../lib/workspace-schema.ts';

const card = (overrides = {}) => ({
  id: 'c1',
  title: 'Title',
  body: 'Body',
  color: 'lemon',
  style: 'sticky',
  size: 24,
  ...overrides,
});
const workspace = (cards, deckOverrides = {}) => ({
  revision: 0,
  decks: [
    { id: 'd1', title: 'Deck', updatedAt: '2026-01-01T00:00:00.000Z', cards, ...deckOverrides },
  ],
});

test('ordinary text, accents and complete emoji are accepted', () => {
  const ok = workspacePayloadSchema.safeParse(
    workspace([card({ body: 'Año nuevo 🎉 — “ficha”' })]),
  );
  assert.equal(ok.success, true);
});

test('a NUL character is refused wherever text is stored', () => {
  for (const parsed of [
    workspacePayloadSchema.safeParse(workspace([card({ body: 'a\u0000b' })])),
    workspacePayloadSchema.safeParse(workspace([card({ title: '\u0000' })])),
    workspacePayloadSchema.safeParse(workspace([card()], { title: 'x\u0000' })),
    workspacePayloadSchema.safeParse(workspace([card({ id: 'a\u0000' })])),
    archivePayloadSchema.safeParse({ id: 'a\u0000', archived: true }),
    fontsPayloadSchema.safeParse({ ids: ['a\u0000'], font: 'mono' }),
  ]) {
    assert.equal(parsed.success, false);
  }
});

test('a lone surrogate, such as an emoji cut in half, is refused', () => {
  const cut = '🎉'.slice(0, 1);
  assert.equal(
    workspacePayloadSchema.safeParse(workspace([card({ body: `hola ${cut}` })])).success,
    false,
  );
  assert.equal(
    workspacePayloadSchema.safeParse(workspace([card({ title: `${'🎉'.slice(1)}` })])).success,
    false,
  );
});

test('JSON.stringify of refused text is exactly what PostgreSQL would reject', () => {
  // The reason for the rule: these escapes are not valid jsonb input.
  assert.match(JSON.stringify({ a: 'a\u0000' }), /\\u0000/);
  assert.match(JSON.stringify({ a: '🎉'.slice(0, 1) }), /\\ud83c/i);
});
