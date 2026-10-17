# Fichas

Fichas is a small web app for preparing a talk on index cards: one idea per card, grouped into decks, then shown one card at a time while you speak. The interface is in Spanish.

## What it does

- Create decks and cards, and pick a style, a colour, a background and a typography for each card.
- Everything saves on its own. The top bar tells you when the last change has reached the server.
- Present a deck full screen: swipe a card away, use the keyboard, or jump with the thumbnails.
- Archive decks, duplicate them, reorder cards by holding and dragging, and undo a deleted card.
- Each person only sees their own decks.

## Stack

- Next.js (App Router), React 19, TypeScript
- Clerk for sign-in
- PostgreSQL through `pg`, with Drizzle ORM for the schema and migrations
- pnpm 11 and Node.js 22 or later

## Run it locally

You need Node.js 22+, pnpm 11 and Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:up
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000. With `AUTH_MODE=demo` (the default in `.env.example`) the app signs in a fixed local user, so you can try it without a Clerk account. A production server refuses that mode on purpose.

To use real sign-in, create a Clerk application and set `AUTH_MODE=clerk`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in `.env`.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test               # unit tests
pnpm test:integration   # API routes against Postgres (needs pnpm db:migrate first)
pnpm test:components    # components and hooks
pnpm e2e                # Playwright, starts next dev on port 3100
pnpm build
```

`pnpm coverage:server` and `pnpm coverage:components` print coverage. CI runs all of this, plus `pnpm audit --prod`, against a Postgres service container.

## More

- [Architecture](docs/ARCHITECTURE.md)
- [HTTP API](docs/API.md)
- [Security](SECURITY.md)

## Licence

All rights reserved, see [LICENSE](LICENSE). The bundled fonts and the vendored shadcn stylesheet keep their own licences.
