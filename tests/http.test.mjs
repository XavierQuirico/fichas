import test from 'node:test';
import assert from 'node:assert/strict';
import { readJsonWithinLimit } from '../app/api/_lib/http.ts';

const streamOf = (chunks) => {
  let pulled = 0;
  const stream = new ReadableStream({
    pull(controller) {
      if (pulled >= chunks.length) return controller.close();
      controller.enqueue(new TextEncoder().encode(chunks[pulled++]));
    },
  });
  return { stream, pulled: () => pulled };
};

const request = (body, headers = {}) =>
  new Request('http://localhost/api/x', { method: 'PUT', body, headers, duplex: 'half' });

test('a normal body is parsed', async () => {
  assert.deepEqual(await readJsonWithinLimit(request('{"a":1}'), 100), { a: 1 });
});

test('a body that is not JSON gives undefined, an empty one too', async () => {
  assert.equal(await readJsonWithinLimit(request('nope'), 100), undefined);
  assert.equal(await readJsonWithinLimit(request(undefined), 100), undefined);
});

test('a declared length over the limit is refused without reading', async () => {
  const { stream, pulled } = streamOf(['{"a":', '1}']);
  const big = request(stream, { 'content-length': '5000' });
  assert.equal(await readJsonWithinLimit(big, 100), null);
  // A ReadableStream pre-pulls one chunk by itself; the handler must not pull more.
  assert.ok(pulled() <= 1, `pulled ${pulled()} chunks`);
});

test('a chunked body with no Content-Length stops being read at the limit', async () => {
  const chunks = Array.from({ length: 50 }, () => 'x'.repeat(1024));
  const { stream, pulled } = streamOf(chunks);
  assert.equal(await readJsonWithinLimit(request(stream), 3 * 1024), null);
  assert.ok(pulled() < chunks.length, `read ${pulled()} of ${chunks.length} chunks`);
});

test('the limit counts bytes, not characters', async () => {
  const body = JSON.stringify({ text: 'ñ'.repeat(60) }); // 60 characters, 120 bytes
  assert.equal(await readJsonWithinLimit(request(body), 100), null);
  assert.notEqual(await readJsonWithinLimit(request(body), 200), null);
});

test('a body split across chunks is put back together', async () => {
  const { stream } = streamOf(['{"na', 'me":"Ma', 'ría"}']);
  assert.deepEqual(await readJsonWithinLimit(request(stream), 100), { name: 'María' });
});
