// Loads the sample decks for one account. Safe to run again: it replaces that
// account's data, and only that account's.
//
//   SEED_OWNER_ID=<Clerk user id> DATABASE_URL=<connection string> pnpm db:seed
//
// For local demo mode the owner id is `local-demo-user`.
import { Pool } from 'pg';
import { demoDecks } from './demo-data.ts';
import { workspacePayloadSchema } from '../lib/server/workspace-schema.ts';
import {
  setDeckArchived,
  writeCardFonts,
  writeWorkspace,
} from '../lib/server/workspace-repository.ts';

const connectionString = process.env.DATABASE_URL;
const ownerId = process.env.SEED_OWNER_ID;
if (!connectionString) throw new Error('DATABASE_URL is required');
if (!ownerId) throw new Error('SEED_OWNER_ID is required (the Clerk user id of the demo account)');

const decks = demoDecks();
const workspace = workspacePayloadSchema.parse({
  revision: 0,
  decks: decks.map(({ id, title, updatedAt, cards }) => ({
    id,
    title,
    updatedAt,
    cards: cards.map(({ font, ...rest }) => rest),
  })),
});

const pool = new Pool({ connectionString, max: 1 });
try {
  await pool.query('DELETE FROM card_fonts WHERE owner_id = $1', [ownerId]);
  await pool.query('DELETE FROM decks WHERE owner_id = $1', [ownerId]);
  await pool.query('DELETE FROM workspaces WHERE owner_id = $1', [ownerId]);

  const revision = await writeWorkspace(pool, ownerId, workspace);
  if (revision === null) throw new Error('Could not write the collection');

  for (const font of ['sans', 'serif', 'hand', 'mono'] as const) {
    const ids = decks.flatMap((d) => d.cards.filter((c) => c.font === font).map((c) => c.id));
    if (ids.length && !(await writeCardFonts(pool, ownerId, { ids, font }))) {
      throw new Error(`Could not save the ${font} typography`);
    }
  }
  for (const deck of decks.filter((d) => d.archived)) {
    if (!(await setDeckArchived(pool, ownerId, deck.id, true))) {
      throw new Error(`Could not archive ${deck.id}`);
    }
  }

  const cards = decks.reduce((total, d) => total + d.cards.length, 0);
  console.log(`Seeded ${decks.length} decks and ${cards} cards for ${ownerId}.`);
} finally {
  await pool.end();
}
