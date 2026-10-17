import test, { after, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import {
  readArchivedDeckIds,
  readCardFonts,
  readWorkspace,
  setDeckArchived,
  writeCardFonts,
  writeWorkspace,
} from '../lib/server/workspace-repository.ts';

const connectionString = process.env.DATABASE_URL;
const pool = connectionString ? new Pool({ connectionString, max: 3 }) : undefined;
const owners = new Set<string>();
after(async () => {
  await pool?.end();
});
afterEach(async () => {
  if (!pool || owners.size === 0) return;
  const ids = [...owners];
  owners.clear();
  await pool.query('DELETE FROM card_fonts WHERE owner_id = ANY($1::text[])', [ids]);
  await pool.query('DELETE FROM decks WHERE owner_id = ANY($1::text[])', [ids]);
  await pool.query('DELETE FROM workspaces WHERE owner_id = ANY($1::text[])', [ids]);
});

test(
  'data, archive state, fonts, and revisions stay inside each owner',
  { skip: !pool },
  async () => {
    const a = `integration:${randomUUID()}`;
    const b = `integration:${randomUUID()}`;
    owners.add(a);
    owners.add(b);
    const timestamp = new Date().toISOString();
    const deckId = `deck:${randomUUID()}`;
    const cardId = `card:${randomUUID()}`;
    const workspace = {
      revision: 0,
      decks: [
        {
          id: deckId,
          title: 'Private idea',
          updatedAt: timestamp,
          cards: [
            {
              id: cardId,
              title: 'Private title',
              body: 'Private body',
              color: 'lemon' as const,
              style: 'sticky' as const,
              size: 24,
            },
          ],
        },
      ],
    };

    assert.equal(await writeWorkspace(pool!, a, workspace), 1);
    assert.equal((await readWorkspace(pool!, a)).decks[0]?.cards[0]?.body, 'Private body');
    assert.deepEqual(await readWorkspace(pool!, b), { decks: [], revision: 0 });

    assert.equal(await setDeckArchived(pool!, b, deckId, true), false);
    assert.equal(await setDeckArchived(pool!, a, deckId, true), true);
    assert.deepEqual(await readArchivedDeckIds(pool!, a), [deckId]);
    assert.deepEqual(await readArchivedDeckIds(pool!, b), []);

    const fontChange = { ids: [cardId], font: 'mono' as const };
    assert.equal(await writeCardFonts(pool!, b, fontChange), false);
    assert.deepEqual(await readCardFonts(pool!, b), {});
    assert.equal(await writeCardFonts(pool!, a, fontChange), true);
    assert.deepEqual(await readCardFonts(pool!, a), { [cardId]: 'mono' });
  },
);

test('deck timestamps survive a save and a second save', { skip: !pool }, async () => {
  const owner = `integration:${randomUUID()}`;
  owners.add(owner);
  const deckId = `deck:${randomUUID()}`;
  const card = {
    id: `card:${randomUUID()}`,
    title: 'One',
    body: 'Body',
    color: 'mint' as const,
    style: 'lined' as const,
    size: 20,
  };
  const firstStamp = '2026-01-02T03:04:05.678Z';
  const secondStamp = '2026-02-03T04:05:06.789Z';

  assert.equal(
    await writeWorkspace(pool!, owner, {
      revision: 0,
      decks: [{ id: deckId, title: 'First title', updatedAt: firstStamp, cards: [card] }],
    }),
    1,
  );
  const afterFirst = await readWorkspace(pool!, owner);
  assert.equal(afterFirst.decks[0]?.updatedAt, firstStamp);

  assert.equal(
    await writeWorkspace(pool!, owner, {
      revision: 1,
      decks: [{ id: deckId, title: 'Second title', updatedAt: secondStamp, cards: [] }],
    }),
    2,
  );
  const afterSecond = await readWorkspace(pool!, owner);
  assert.equal(afterSecond.decks[0]?.title, 'Second title');
  assert.equal(afterSecond.decks[0]?.updatedAt, secondStamp);
  assert.deepEqual(afterSecond.decks[0]?.cards, []);
  assert.equal(afterSecond.revision, 2);
});

test(
  'an archived deck stays archived when the collection is saved again',
  { skip: !pool },
  async () => {
    const owner = `integration:${randomUUID()}`;
    owners.add(owner);
    const deckId = `deck:${randomUUID()}`;
    const stamp = new Date().toISOString();
    const decks = [{ id: deckId, title: 'Keep me', updatedAt: stamp, cards: [] }];

    assert.equal(await writeWorkspace(pool!, owner, { revision: 0, decks }), 1);
    assert.equal(await setDeckArchived(pool!, owner, deckId, true), true);
    assert.equal(await writeWorkspace(pool!, owner, { revision: 1, decks }), 2);
    assert.deepEqual(await readArchivedDeckIds(pool!, owner), [deckId]);
  },
);

test('optimistic revision permits only one concurrent update', { skip: !pool }, async () => {
  const owner = `integration:${randomUUID()}`;
  owners.add(owner);
  const first = { revision: 0, decks: [] };
  const results = await Promise.all([
    writeWorkspace(pool!, owner, first),
    writeWorkspace(pool!, owner, first),
  ]);
  assert.equal(results.filter((revision) => revision === 1).length, 1);
  assert.equal(results.filter((revision) => revision === null).length, 1);
});
