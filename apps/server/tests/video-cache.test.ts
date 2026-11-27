import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseCacheIdsRequest } from '../src/modules/pan115/services/cache-ids.js';

test('accepts a single cid with the default delay', () => {
  assert.deepEqual(parseCacheIdsRequest({ cid: '12345' }), {
    cids: ['12345'],
    delayMs: 500,
  });
});

test('accepts and deduplicates a cid array with a custom delay', () => {
  assert.deepEqual(parseCacheIdsRequest({ cid: ['12', '34', '12'], delayMs: 1000 }), {
    cids: ['12', '34'],
    delayMs: 1000,
  });
});

test('rejects malformed cids, delays, and payloads', () => {
  assert.equal(parseCacheIdsRequest({}), undefined);
  assert.equal(parseCacheIdsRequest({ cid: 'abc' }), undefined);
  assert.equal(parseCacheIdsRequest({ cid: [] }), undefined);
  assert.equal(parseCacheIdsRequest({ cid: ['1', 'bad'] }), undefined);
  assert.equal(parseCacheIdsRequest({ cid: '1', delayMs: -1 }), undefined);
  assert.equal(parseCacheIdsRequest({ cid: '1', delayMs: 5001 }), undefined);
  assert.equal(parseCacheIdsRequest(['1']), undefined);
});

