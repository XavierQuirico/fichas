import test from 'node:test';
import assert from 'node:assert/strict';
import { demoDecks } from '../scripts/demo-data.ts';
import { workspacePayloadSchema } from '../lib/workspace-schema.ts';

const withoutFonts = (decks) =>
  decks.map(({ id, title, updatedAt, cards }) => ({
    id,
    title,
    updatedAt,
    cards: cards.map(({ font, ...rest }) => rest),
  }));

test('the demo decks satisfy the schema the API enforces', () => {
  const parsed = workspacePayloadSchema.safeParse({
    revision: 0,
    decks: withoutFonts(demoDecks()),
  });
  assert.equal(parsed.success, true, parsed.success ? '' : JSON.stringify(parsed.error.issues));
});

test('the demo data is stable between runs and uses only example.com links', () => {
  assert.deepEqual(demoDecks(), demoDecks());
  const text = JSON.stringify(demoDecks());
  const hosts = [...text.matchAll(/(?:https?:\/\/|[\w.-]+@)([\w.-]+\.[a-z]{2,})/g)].map(
    (m) => m[1],
  );
  assert.ok(hosts.length > 0);
  for (const host of hosts) assert.equal(host, 'example.com');
});

test('the demo includes one archived deck and several typographies', () => {
  const decks = demoDecks();
  assert.equal(decks.filter((d) => d.archived).length, 1);
  const fonts = new Set(decks.flatMap((d) => d.cards.map((c) => c.font)).filter(Boolean));
  assert.ok(fonts.size >= 3);
});
