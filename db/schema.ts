import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const workspaces = pgTable(
  'workspaces',
  {
    ownerId: text('owner_id').primaryKey(),
    revision: integer('revision').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check('workspaces_revision_check', sql`${table.revision} >= 0`)],
);

export const decks = pgTable(
  'decks',
  {
    id: text('id').notNull(),
    ownerId: text('owner_id').notNull(),
    title: text('title').notNull(),
    position: integer('position').notNull(),
    archived: boolean('archived').notNull().default(false),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerId, table.id] }),
    index('decks_owner_position_idx').on(table.ownerId, table.position),
    check('decks_title_length_check', sql`char_length(${table.title}) BETWEEN 1 AND 160`),
    check('decks_position_check', sql`${table.position} >= 0`),
  ],
);

export const cards = pgTable(
  'cards',
  {
    id: text('id').notNull(),
    ownerId: text('owner_id').notNull(),
    deckId: text('deck_id').notNull(),
    title: text('title').notNull().default(''),
    body: text('body').notNull().default(''),
    color: text('color').notNull(),
    style: text('style').notNull(),
    size: integer('size').notNull(),
    backgroundColor: text('background_color'),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.ownerId, table.id] }),
    foreignKey({
      name: 'cards_owner_deck_fk',
      columns: [table.ownerId, table.deckId],
      foreignColumns: [decks.ownerId, decks.id],
    }).onDelete('cascade'),
    index('cards_owner_deck_position_idx').on(table.ownerId, table.deckId, table.position),
    check('cards_title_length_check', sql`char_length(${table.title}) <= 300`),
    check('cards_body_length_check', sql`char_length(${table.body}) <= 20000`),
    check(
      'cards_color_check',
      sql`${table.color} IN ('lemon','peach','blue','mint','lilac','white')`,
    ),
    check('cards_style_check', sql`${table.style} IN ('sticky','lined','clean','grid')`),
    check('cards_size_check', sql`${table.size} BETWEEN 18 AND 42`),
    check('cards_position_check', sql`${table.position} >= 0`),
    check(
      'cards_background_color_check',
      sql`${table.backgroundColor} IS NULL OR ${table.backgroundColor} IN ('default','blue-mist','lilac-mist','ink','orange','red')`,
    ),
  ],
);

export const cardFonts = pgTable(
  'card_fonts',
  {
    ownerId: text('owner_id').notNull(),
    cardId: text('card_id').notNull(),
    font: text('font').notNull().default('sans'),
  },
  (table) => [
    primaryKey({ columns: [table.ownerId, table.cardId] }),
    foreignKey({
      name: 'card_fonts_owner_card_fk',
      columns: [table.ownerId, table.cardId],
      foreignColumns: [cards.ownerId, cards.id],
    }).onDelete('cascade'),
    check('card_fonts_font_check', sql`${table.font} IN ('sans','serif','hand','mono')`),
  ],
);
