import test from 'node:test';
import assert from 'node:assert/strict';
import { readWorkspace, writeCardFonts } from '../lib/workspace-repository.ts';

/** A pool whose client logs every statement and can fail on the Nth one. */
function fakePool({ failOn, code } = {}) {
  const log = [];
  let released = 0;
  const client = {
    async query(sql) {
      const text = String(sql).trim().split(/\s+/).slice(0, 3).join(' ');
      log.push(text);
      if (failOn !== undefined && log.length === failOn) {
        throw Object.assign(new Error('boom'), { code });
      }
      return { rows: [], rowCount: 0 };
    },
    release() {
      released++;
    },
  };
  return { pool: { connect: async () => client }, log, released: () => released };
}

test('a failed read rolls back before the connection goes back to the pool', async () => {
  const { pool, log, released } = fakePool({ failOn: 3 });
  await assert.rejects(() => readWorkspace(pool, 'owner'), /boom/);
  assert.equal(log.at(-1), 'ROLLBACK');
  assert.equal(released(), 1);
});

test('a successful read commits and releases once', async () => {
  const { pool, log, released } = fakePool();
  assert.deepEqual(await readWorkspace(pool, 'owner'), { decks: [], revision: 0 });
  assert.equal(log.at(-1), 'COMMIT');
  assert.equal(released(), 1);
});

test('a font for a card deleted in the meantime answers false, not an error', async () => {
  const { pool, log } = fakePool({ failOn: 2, code: '23503' });
  assert.equal(await writeCardFonts(pool, 'owner', { ids: ['gone'], font: 'mono' }), false);
  assert.equal(log.at(-1), 'ROLLBACK');
});

test('any other database error in the font save still surfaces', async () => {
  const { pool } = fakePool({ failOn: 2, code: '08006' });
  await assert.rejects(() => writeCardFonts(pool, 'owner', { ids: ['x'], font: 'mono' }), /boom/);
});
