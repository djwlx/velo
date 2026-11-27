import assert from 'node:assert/strict';
import { test } from 'node:test';

import { parseCacheIdsRequest } from '../src/modules/pan115/services/cache-ids.js';
import {
  isAllowed115VideoUrl,
  parseExcludedPickCodes,
  rewriteHlsPlaylist,
} from '../src/modules/pan115/services/video.js';

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

test('deduplicates and validates excluded pick codes', () => {
  assert.deepEqual(parseExcludedPickCodes(['pc1,pc2', 'pc2', 'bad code', '', 'pc-3']), [
    'pc1',
    'pc2',
    'pc-3',
  ]);
  assert.equal(parseExcludedPickCodes(Array(600).fill('pc1')).length, 1);
});

test('only allows 115 hosts for proxied HLS resources', () => {
  assert.ok(isAllowed115VideoUrl('https://115.com/api/video/master.m3u8'));
  assert.ok(isAllowed115VideoUrl('https://cpats01.115.com/seg1.ts'));
  assert.equal(isAllowed115VideoUrl('http://115.com/seg1.ts'), undefined);
  assert.equal(isAllowed115VideoUrl('https://evil.com/115.com/seg1.ts'), undefined);
  assert.equal(isAllowed115VideoUrl('not a url'), undefined);
});

test('keeps authentication token in custom HLS proxy URLs', () => {
  const rewritten = rewriteHlsPlaylist(
    '#EXTM3U\n/seg1.ts',
    'https://cpats01.115.com/hls/master.m3u8',
    'pc123',
    (url) => `/api/115/video/stream/pc123?${new URLSearchParams({ url, token: 'jwt-token' })}`,
  );
  const proxy = new URL(rewritten.split('\n')[1]!, 'http://localhost');

  assert.equal(proxy.searchParams.get('token'), 'jwt-token');
  assert.equal(proxy.searchParams.get('url'), 'https://cpats01.115.com/seg1.ts');
});

test('rewrites HLS playlist URLs through the local proxy', () => {
  const playlist = [
    '#EXTM3U',
    '#EXT-X-KEY:METHOD=AES-128,URI="https://cpats01.115.com/key.bin"',
    '/seg1.ts',
    'https://cpats01.115.com/seg2.ts',
  ].join('\n');
  const rewritten = rewriteHlsPlaylist(
    playlist,
    'https://cpats01.115.com/hls/master.m3u8',
    'pc123',
  ).split('\n');

  const keyLine = new URL(
    rewritten[1]!.replace('#EXT-X-KEY:METHOD=AES-128,URI="', '').replace('"', ''),
    'http://localhost',
  );
  assert.equal(keyLine.searchParams.get('pickCode'), 'pc123');
  assert.equal(keyLine.searchParams.get('url'), 'https://cpats01.115.com/key.bin');

  const relativeSegment = new URL(rewritten[2]!, 'http://localhost');
  assert.equal(relativeSegment.searchParams.get('pickCode'), 'pc123');
  assert.equal(relativeSegment.searchParams.get('url'), 'https://cpats01.115.com/seg1.ts');

  const absoluteSegment = new URL(rewritten[3]!, 'http://localhost');
  assert.equal(absoluteSegment.searchParams.get('pickCode'), 'pc123');
  assert.equal(absoluteSegment.searchParams.get('url'), 'https://cpats01.115.com/seg2.ts');
});
