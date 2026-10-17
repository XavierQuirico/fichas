import test from 'node:test';
import assert from 'node:assert/strict';
import { workspacePayloadSchema, fontsPayloadSchema } from '../lib/workspace-schema.ts';

const validWorkspace = {
  revision: 0,
  decks: [
    {
      id: 'deck-a',
      title: 'Ideas',
      updatedAt: '2026-10-16T00:00:00.000Z',
      cards: [
        { id: 'card-a', title: '', body: 'One idea', color: 'lemon', style: 'sticky', size: 24 },
      ],
    },
  ],
};

test('workspace accepts the editor data contract', () => {
  assert.equal(workspacePayloadSchema.safeParse(validWorkspace).success, true);
});

test('workspace rejects unsupported styles and duplicate IDs', () => {
  assert.equal(
    workspacePayloadSchema.safeParse({
      ...validWorkspace,
      decks: [
        {
          ...validWorkspace.decks[0],
          cards: [{ ...validWorkspace.decks[0].cards[0], style: 'unknown' }],
        },
      ],
    }).success,
    false,
  );
  assert.equal(
    workspacePayloadSchema.safeParse({
      ...validWorkspace,
      decks: [validWorkspace.decks[0], validWorkspace.decks[0]],
    }).success,
    false,
  );
  assert.equal(
    workspacePayloadSchema.safeParse({
      ...validWorkspace,
      decks: [
        {
          ...validWorkspace.decks[0],
          cards: [validWorkspace.decks[0].cards[0], validWorkspace.decks[0].cards[0]],
        },
      ],
    }).success,
    false,
  );
});

test('font updates reject duplicate card IDs and invalid font names', () => {
  assert.equal(fontsPayloadSchema.safeParse({ ids: ['a', 'a'], font: 'sans' }).success, false);
  assert.equal(fontsPayloadSchema.safeParse({ ids: ['a'], font: 'comic' }).success, false);
});
