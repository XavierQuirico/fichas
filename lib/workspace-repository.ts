import type { Pool } from 'pg';
import type { z } from 'zod';
import type { fontsPayloadSchema, workspacePayloadSchema } from './workspace-schema';

type WorkspacePayload = z.infer<typeof workspacePayloadSchema>;
type FontsPayload = z.infer<typeof fontsPayloadSchema>;
type DeckRow = { id: string; title: string; updated_at: Date | string; position: number };
type CardRow = {
  id: string;
  deck_id: string;
  title: string;
  body: string;
  color: string;
  style: string;
  size: number;
  background_color: string | null;
  position: number;
};

const FOREIGN_KEY_VIOLATION = '23503';

export async function readWorkspace(pool: Pool, ownerId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const state = await client.query<{ revision: number }>(
      'SELECT revision FROM workspaces WHERE owner_id = $1',
      [ownerId],
    );
    const deckResult = await client.query<DeckRow>(
      'SELECT id, title, updated_at, position FROM decks WHERE owner_id = $1 ORDER BY position ASC',
      [ownerId],
    );
    const cardResult = await client.query<CardRow>(
      `SELECT id, deck_id, title, body, color, style, size, background_color, position
       FROM cards WHERE owner_id = $1 ORDER BY deck_id ASC, position ASC`,
      [ownerId],
    );
    await client.query('COMMIT');

    const cardsByDeck = new Map<string, CardRow[]>();
    for (const row of cardResult.rows) {
      const cards = cardsByDeck.get(row.deck_id) ?? [];
      cards.push(row);
      cardsByDeck.set(row.deck_id, cards);
    }
    return {
      decks: deckResult.rows.map((row) => ({
        id: row.id,
        title: row.title,
        updatedAt: new Date(row.updated_at).toISOString(),
        cards: (cardsByDeck.get(row.id) ?? []).map((card) => ({
          id: card.id,
          title: card.title,
          body: card.body,
          color: card.color,
          style: card.style,
          size: card.size,
          ...(card.background_color ? { backgroundColor: card.background_color } : {}),
        })),
      })),
      revision: state.rows[0]?.revision ?? 0,
    };
  } catch (error) {
    // Never hand a connection back to the pool inside an aborted transaction.
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function writeWorkspace(
  pool: Pool,
  ownerId: string,
  workspace: WorkspacePayload,
): Promise<number | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO workspaces (owner_id) VALUES ($1) ON CONFLICT (owner_id) DO NOTHING',
      [ownerId],
    );
    const state = await client.query<{ revision: number }>(
      'SELECT revision FROM workspaces WHERE owner_id = $1 FOR UPDATE',
      [ownerId],
    );
    const currentRevision = state.rows[0]?.revision ?? 0;
    if (currentRevision !== workspace.revision) {
      await client.query('ROLLBACK');
      return null;
    }

    const deckRows = workspace.decks.map(({ id, title, updatedAt }, position) => ({
      id,
      title,
      updated_at: updatedAt,
      position,
    }));
    await client.query(
      `INSERT INTO decks (id, owner_id, title, position, updated_at)
       SELECT row.id, $1, row.title, row.position, row.updated_at::timestamptz
       FROM jsonb_to_recordset($2::jsonb) AS row(id text, title text, updated_at text, position integer)
       ON CONFLICT (owner_id, id) DO UPDATE SET
         title = EXCLUDED.title, position = EXCLUDED.position, updated_at = EXCLUDED.updated_at`,
      [ownerId, JSON.stringify(deckRows)],
    );

    const cardRows = workspace.decks.flatMap((deck) =>
      deck.cards.map((card, position) => ({
        id: card.id,
        deck_id: deck.id,
        title: card.title,
        body: card.body,
        color: card.color,
        style: card.style,
        size: card.size,
        background_color: card.backgroundColor ?? null,
        position,
      })),
    );
    const deckIds = workspace.decks.map((deck) => deck.id);
    const cardIds = cardRows.map((card) => card.id);
    await client.query('DELETE FROM cards WHERE owner_id = $1 AND NOT (id = ANY($2::text[]))', [
      ownerId,
      cardIds,
    ]);
    await client.query(
      `INSERT INTO cards (id, owner_id, deck_id, title, body, color, style, size, background_color, position)
       SELECT row.id, $1, row.deck_id, row.title, row.body, row.color, row.style, row.size, row.background_color, row.position
       FROM jsonb_to_recordset($2::jsonb) AS row(
         id text, deck_id text, title text, body text, color text, style text,
         size integer, background_color text, position integer
       ) ON CONFLICT (owner_id, id) DO UPDATE SET
         deck_id = EXCLUDED.deck_id, title = EXCLUDED.title, body = EXCLUDED.body,
         color = EXCLUDED.color, style = EXCLUDED.style, size = EXCLUDED.size,
         background_color = EXCLUDED.background_color, position = EXCLUDED.position`,
      [ownerId, JSON.stringify(cardRows)],
    );
    await client.query('DELETE FROM decks WHERE owner_id = $1 AND NOT (id = ANY($2::text[]))', [
      ownerId,
      deckIds,
    ]);
    const nextRevision = currentRevision + 1;
    await client.query(
      'UPDATE workspaces SET revision = $2, updated_at = now() WHERE owner_id = $1',
      [ownerId, nextRevision],
    );
    await client.query('COMMIT');
    return nextRevision;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function readArchivedDeckIds(pool: Pool, ownerId: string): Promise<string[]> {
  const result = await pool.query<{ id: string }>(
    'SELECT id FROM decks WHERE owner_id = $1 AND archived = true ORDER BY position ASC',
    [ownerId],
  );
  return result.rows.map((row) => row.id);
}

export async function setDeckArchived(
  pool: Pool,
  ownerId: string,
  id: string,
  archived: boolean,
): Promise<boolean> {
  const result = await pool.query(
    'UPDATE decks SET archived = $3 WHERE owner_id = $1 AND id = $2 RETURNING id',
    [ownerId, id, archived],
  );
  return result.rowCount === 1;
}

export async function readCardFonts(pool: Pool, ownerId: string): Promise<Record<string, string>> {
  const result = await pool.query<{ card_id: string; font: string }>(
    'SELECT card_id, font FROM card_fonts WHERE owner_id = $1',
    [ownerId],
  );
  return Object.fromEntries(result.rows.map((row) => [row.card_id, row.font]));
}

export async function writeCardFonts(
  pool: Pool,
  ownerId: string,
  payload: FontsPayload,
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{ card_id: string }>(
      `INSERT INTO card_fonts (owner_id, card_id, font)
       SELECT $1, requested.card_id, $2
       FROM unnest($3::text[]) AS requested(card_id)
       INNER JOIN cards card ON card.id = requested.card_id AND card.owner_id = $1
       ON CONFLICT (owner_id, card_id) DO UPDATE SET font = EXCLUDED.font
       RETURNING card_id`,
      [ownerId, payload.font, payload.ids],
    );
    if (result.rowCount !== payload.ids.length) {
      await client.query('ROLLBACK');
      return false;
    }
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    // A card deleted by a concurrent save between the join and the insert.
    if ((error as { code?: string }).code === FOREIGN_KEY_VIOLATION) return false;
    throw error;
  } finally {
    client.release();
  }
}
