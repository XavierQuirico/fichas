# HTTP API

These routes serve the web interface and need a Clerk session. They are not a public API for third parties.

| Method and route      | Use                                     | Main response         |
| --------------------- | --------------------------------------- | --------------------- |
| `GET /api/workspace`  | Read my decks                           | `{ decks, revision }` |
| `PUT /api/workspace`  | Save the whole collection at a revision | `{ revision }`        |
| `GET /api/archive`    | Read my archived deck ids               | `{ ids }`             |
| `PUT /api/archive`    | Archive or restore one of my decks      | `{ ok: true }`        |
| `GET /api/card-fonts` | Read the typography of my cards         | `{ fonts }`           |
| `PUT /api/card-fonts` | Set the typography of some of my cards  | `{ ok: true }`        |

## Order of checks on a write

1. Session. No user id means `401`.
2. Origin. A missing or foreign `Origin`/`Referer` means `403`.
3. Rate limit per account. Over the limit means `429` with `Retry-After`.
4. Body size. Over the cap means `413`.
5. Validation with Zod. Anything invalid, including malformed JSON, means `400`.
6. The query. A missing resource, or one that belongs to someone else, means `404`. A stale revision means `409`.

Reads only run steps 1 and 6. Every response sends `Cache-Control: no-store`.

## Status codes

| Code  | Meaning                                     |
| ----- | ------------------------------------------- |
| `400` | Invalid payload                             |
| `401` | No session                                  |
| `403` | Untrusted origin on a write                 |
| `404` | Not found, or not owned by the caller       |
| `409` | The collection changed in another window    |
| `413` | Body over the size cap                      |
| `429` | Too many writes; wait `Retry-After` seconds |
| `503` | Storage not available                       |

## Limits

| Route                 | Body cap | Rate limit per account |
| --------------------- | -------- | ---------------------- |
| `PUT /api/workspace`  | 4 MiB    | 120 per minute         |
| `PUT /api/archive`    | 8 KiB    | 30 per minute          |
| `PUT /api/card-fonts` | 32 KiB   | 30 per minute          |

Inside the collection: at most 200 decks, 200 cards per deck, a deck title of 1 to 160 characters, a card title of up to 300 and a card body of up to 20,000. Text cannot contain a NUL character or a lone surrogate (an emoji cut in half): PostgreSQL would reject it and every later save would fail, so it is a `400` instead.

The body cap is enforced while the body is read, in chunks, so it also holds for uploads that arrive without a `Content-Length` header.

## Saving the collection

`PUT /api/workspace` replaces the whole collection every time. The client sends all decks and the revision it last saw. The server locks the owner's row, compares the revision, applies the change in one transaction and answers with the next revision, or `409` if somebody else got there first. I chose this because the collection is small and it keeps the model simple. The cost is that every autosave resends everything.

## Card fonts depend on saved cards

`PUT /api/card-fonts` only stores a font for a card the server already has, and it is all or nothing: if one id is unknown the whole request answers `404`. So the client saves the pending collection first and then sends the font.

## Adding integrations

A third-party API should be a separate contract under `/api/v1` with revocable credentials and scopes. The routes above should not be exposed for that.
