import { z } from 'zod';
import { MAX_CARD_BODY_LENGTH, MAX_CARD_TITLE_LENGTH } from './card-limits.ts';

/**
 * Text that PostgreSQL can store: no NUL character, and no lone surrogate
 * (cutting an emoji in half at a length limit leaves one). Either makes the
 * jsonb input fail, which would turn every later save into a 503.
 */
export const isStorableText = (value: string) => !value.includes('\u0000') && value.isWellFormed();

const text = (max: number, min = 0) =>
  z
    .string()
    .min(min)
    .max(max)
    .refine(isStorableText, { message: 'Contains characters that cannot be stored' });

export const cardSchema = z.object({
  id: text(100, 1),
  title: text(MAX_CARD_TITLE_LENGTH),
  body: text(MAX_CARD_BODY_LENGTH),
  color: z.enum(['lemon', 'peach', 'blue', 'mint', 'lilac', 'white']),
  style: z.enum(['sticky', 'lined', 'clean', 'grid']),
  size: z.number().int().min(18).max(42),
  backgroundColor: z
    .enum(['default', 'blue-mist', 'lilac-mist', 'ink', 'orange', 'red'])
    .optional(),
});

export const deckSchema = z.object({
  id: text(100, 1),
  title: text(160, 1),
  cards: z
    .array(cardSchema)
    .max(200)
    .refine((cards) => new Set(cards.map((card) => card.id)).size === cards.length),
  updatedAt: z.string().datetime(),
});

export const workspacePayloadSchema = z
  .object({
    revision: z.number().int().nonnegative(),
    decks: z
      .array(deckSchema)
      .max(200)
      .refine((decks) => new Set(decks.map((deck) => deck.id)).size === decks.length),
  })
  .refine((workspace) => {
    const cardIds = workspace.decks.flatMap((deck) => deck.cards.map((card) => card.id));
    return new Set(cardIds).size === cardIds.length;
  });

export const archivePayloadSchema = z.object({
  id: text(100, 1),
  archived: z.boolean(),
});

export const fontsPayloadSchema = z.object({
  ids: z
    .array(text(100, 1))
    .min(1)
    .max(200)
    .refine((ids) => new Set(ids).size === ids.length),
  font: z.enum(['sans', 'serif', 'hand', 'mono']),
});

export const MAX_WORKSPACE_BYTES = 4 * 1024 * 1024;
