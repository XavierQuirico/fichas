import test, { after, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { Pool } from 'pg';
import { database } from '../db/store.ts';
import * as workspaceRoute from '../app/api/workspace/route.ts';
import * as archiveRoute from '../app/api/archive/route.ts';
import * as fontsRoute from '../app/api/card-fonts/route.ts';

// These tests call the real route handlers against a real Postgres. Only the
// Clerk SDK is replaced (tests/helpers); lib/auth.ts runs as shipped.
const connected = Boolean(process.env.DATABASE_URL);
const ORIGIN = 'http://localhost:3000';

Object.assign(process.env, {
  AUTH_MODE: 'clerk',
  CLERK_SECRET_KEY: 'sk_test_placeholder',
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_placeholder',
});

const session = globalThis as typeof globalThis & { __testUserId?: string | null };
const owners = new Set<string>();

function signIn(): string {
  const id = `api-test:${randomUUID()}`;
  owners.add(id);
  session.__testUserId = id;
  return id;
}

type Init = { method?: string; body?: unknown; origin?: string | null };

function request(path: string, { method = 'GET', body, origin = ORIGIN }: Init = {}) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (origin) headers.origin = origin;
  const raw =
    body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
  return new Request(`${ORIGIN}${path}`, { method, headers, body: raw });
}

const card = (overrides: Record<string, unknown> = {}) => ({
  id: `card:${randomUUID()}`,
  title: 'Title',
  body: 'Body',
  color: 'mint',
  style: 'lined',
  size: 24,
  ...overrides,
});

const deck = (cards: unknown[] = [card()]) => ({
  id: `deck:${randomUUID()}`,
  title: 'A deck',
  updatedAt: new Date().toISOString(),
  cards,
});

let pool: Pool | undefined;
beforeEach(() => {
  session.__testUserId = null;
  if (connected) pool = database();
});
afterEach(async () => {
  if (!pool || owners.size === 0) return;
  const ids = [...owners];
  owners.clear();
  await pool.query('DELETE FROM card_fonts WHERE owner_id = ANY($1::text[])', [ids]);
  await pool.query('DELETE FROM decks WHERE owner_id = ANY($1::text[])', [ids]);
  await pool.query('DELETE FROM workspaces WHERE owner_id = ANY($1::text[])', [ids]);
});
after(async () => {
  await pool?.end();
});

const opts = { skip: !connected };

test('every route answers 401 without a session', opts, async () => {
  for (const [name, route] of [
    ['/api/workspace', workspaceRoute],
    ['/api/archive', archiveRoute],
    ['/api/card-fonts', fontsRoute],
  ] as const) {
    assert.equal((await route.GET()).status, 401, `GET ${name}`);
    assert.equal(
      (await route.PUT(request(name, { method: 'PUT', body: {} }))).status,
      401,
      `PUT ${name}`,
    );
  }
});

test('writes from another origin or with no origin are refused with 403', opts, async () => {
  signIn();
  const payload = { revision: 0, decks: [] };
  for (const origin of ['https://evil.example', null]) {
    const response = await workspaceRoute.PUT(
      request('/api/workspace', { method: 'PUT', body: payload, origin }),
    );
    assert.equal(response.status, 403, `origin ${origin}`);
  }
});

test('a saved collection can be read back by its owner', opts, async () => {
  signIn();
  const saved = deck();
  const put = await workspaceRoute.PUT(
    request('/api/workspace', { method: 'PUT', body: { revision: 0, decks: [saved] } }),
  );
  assert.equal(put.status, 200);
  assert.deepEqual(await put.json(), { revision: 1 });

  const get = await workspaceRoute.GET();
  assert.equal(get.status, 200);
  const data = (await get.json()) as {
    revision: number;
    decks: { id: string; updatedAt: string }[];
  };
  assert.equal(data.revision, 1);
  assert.equal(data.decks[0]?.id, saved.id);
  assert.equal(data.decks[0]?.updatedAt, saved.updatedAt);
  assert.equal(get.headers.get('cache-control'), 'no-store, max-age=0');
});

test('invalid collections are refused with 400', opts, async () => {
  signIn();
  const tooLong = card({ body: 'x'.repeat(20_001) });
  const bodies: unknown[] = [
    'not json',
    { revision: 0 },
    { revision: 0, decks: [deck([card({ color: 'pink' })])] },
    { revision: 0, decks: [deck([tooLong])] },
    { revision: 0, decks: [deck([card({ id: 'dup' }), card({ id: 'dup' })])] },
    // Text PostgreSQL cannot store: refused as 400, never a 503 on every later save.
    { revision: 0, decks: [deck([card({ body: 'a\u0000b' })])] },
    { revision: 0, decks: [deck([card({ body: `cut ${'🎉'.slice(0, 1)}` })])] },
  ];
  for (const body of bodies) {
    const response = await workspaceRoute.PUT(request('/api/workspace', { method: 'PUT', body }));
    assert.equal(response.status, 400, JSON.stringify(body).slice(0, 80));
  }
});

test('a chunked upload with no Content-Length is cut off at the cap with 413', opts, async () => {
  signIn();
  const chunk = new TextEncoder().encode('x'.repeat(64 * 1024));
  let sent = 0;
  const body = new ReadableStream({
    pull(controller) {
      // Far more than the 4 MiB cap; the handler has to stop reading by itself.
      if (sent++ >= 200) return controller.close();
      controller.enqueue(chunk);
    },
  });
  const response = await workspaceRoute.PUT(
    new Request(`${ORIGIN}/api/workspace`, {
      method: 'PUT',
      headers: { origin: ORIGIN, 'content-type': 'application/json' },
      body,
      duplex: 'half',
    } as RequestInit),
  );
  assert.equal(response.status, 413);
  assert.ok(sent < 100, `the handler read ${sent} chunks`);
});

test('a card body of exactly 20000 characters is accepted', opts, async () => {
  signIn();
  const response = await workspaceRoute.PUT(
    request('/api/workspace', {
      method: 'PUT',
      body: { revision: 0, decks: [deck([card({ body: 'x'.repeat(20_000) })])] },
    }),
  );
  assert.equal(response.status, 200);
});

test('a stale revision is refused with 409 and changes nothing', opts, async () => {
  signIn();
  const first = deck();
  await workspaceRoute.PUT(
    request('/api/workspace', { method: 'PUT', body: { revision: 0, decks: [first] } }),
  );
  const stale = await workspaceRoute.PUT(
    request('/api/workspace', { method: 'PUT', body: { revision: 0, decks: [] } }),
  );
  assert.equal(stale.status, 409);
  const data = (await (await workspaceRoute.GET()).json()) as {
    decks: unknown[];
    revision: number;
  };
  assert.equal(data.decks.length, 1);
  assert.equal(data.revision, 1);
});

test('a collection over 4 MB is refused with 413', opts, async () => {
  signIn();
  const response = await workspaceRoute.PUT(
    request('/api/workspace', {
      method: 'PUT',
      body: JSON.stringify({ pad: 'x'.repeat(4 * 1024 * 1024 + 1) }),
    }),
  );
  assert.equal(response.status, 413);
});

test('one account never sees another account’s collection', opts, async () => {
  signIn();
  await workspaceRoute.PUT(
    request('/api/workspace', { method: 'PUT', body: { revision: 0, decks: [deck()] } }),
  );
  signIn();
  const data = (await (await workspaceRoute.GET()).json()) as {
    decks: unknown[];
    revision: number;
  };
  assert.deepEqual(data, { decks: [], revision: 0 });
});

test('writes are limited to 120 a minute per account, with Retry-After', opts, async () => {
  signIn();
  const send = () => workspaceRoute.PUT(request('/api/workspace', { method: 'PUT', body: {} }));
  for (let i = 0; i < 120; i++) assert.equal((await send()).status, 400);
  const limited = await send();
  assert.equal(limited.status, 429);
  assert.ok(Number(limited.headers.get('retry-after')) >= 1);
  signIn();
  assert.equal((await send()).status, 400, 'another account is not affected');
});

test('archiving: 400, 404, success, and another account cannot touch the deck', opts, async () => {
  signIn();
  const mine = deck();
  await workspaceRoute.PUT(
    request('/api/workspace', { method: 'PUT', body: { revision: 0, decks: [mine] } }),
  );

  const put = (body: unknown) => archiveRoute.PUT(request('/api/archive', { method: 'PUT', body }));
  assert.equal((await put({ id: mine.id })).status, 400);
  assert.equal((await put({ id: 'missing', archived: true })).status, 404);
  assert.equal(
    (
      await archiveRoute.PUT(
        request('/api/archive', {
          method: 'PUT',
          body: { id: mine.id, archived: true },
          origin: 'https://evil.example',
        }),
      )
    ).status,
    403,
  );
  assert.equal((await put({ id: mine.id, archived: true })).status, 200);
  assert.deepEqual(await (await archiveRoute.GET()).json(), { ids: [mine.id] });

  signIn();
  assert.equal((await put({ id: mine.id, archived: false })).status, 404);
  assert.deepEqual(await (await archiveRoute.GET()).json(), { ids: [] });
});

test('archive requests over 8 KB are refused with 413', opts, async () => {
  signIn();
  const response = await archiveRoute.PUT(
    request('/api/archive', { method: 'PUT', body: { id: 'x'.repeat(9_000), archived: true } }),
  );
  assert.equal(response.status, 413);
});

test('fonts: 400, 404, success, and another account’s cards are not found', opts, async () => {
  signIn();
  const c = card();
  await workspaceRoute.PUT(
    request('/api/workspace', { method: 'PUT', body: { revision: 0, decks: [deck([c])] } }),
  );

  const put = (body: unknown) =>
    fontsRoute.PUT(request('/api/card-fonts', { method: 'PUT', body }));
  assert.equal((await put({ ids: [c.id], font: 'comic' })).status, 400);
  assert.equal((await put({ ids: [], font: 'mono' })).status, 400);
  assert.equal((await put({ ids: ['missing'], font: 'mono' })).status, 404);
  assert.equal((await put({ ids: [c.id], font: 'mono' })).status, 200);
  assert.deepEqual(await (await fontsRoute.GET()).json(), { fonts: { [c.id]: 'mono' } });

  signIn();
  assert.equal((await put({ ids: [c.id], font: 'serif' })).status, 404);
  assert.deepEqual(await (await fontsRoute.GET()).json(), { fonts: {} });
});

test('font requests over 32 KB are refused with 413', opts, async () => {
  signIn();
  const ids = Array.from({ length: 1000 }, () => randomUUID());
  const response = await fontsRoute.PUT(
    request('/api/card-fonts', { method: 'PUT', body: { ids, font: 'mono' } }),
  );
  assert.equal(response.status, 413);
});
