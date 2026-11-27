const MAX_CID_COUNT = 100;

export type CacheIdsRequest = {
  cids: string[];
  delayMs: number;
};

export function parseCacheIdsRequest(body: unknown): CacheIdsRequest | undefined {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return undefined;

  const payload = body as { cid?: unknown; delayMs?: unknown };
  const rawCids = Array.isArray(payload.cid) ? payload.cid : [payload.cid];
  const validCids = rawCids.filter(
    (cid): cid is string => typeof cid === 'string' && /^\d{1,64}$/.test(cid.trim()),
  );
  if (
    rawCids.length === 0 ||
    rawCids.length > MAX_CID_COUNT ||
    validCids.length !== rawCids.length
  ) {
    return undefined;
  }
  const cids = [...new Set(validCids.map((cid) => cid.trim()))];

  const delayMs = payload.delayMs ?? 500;
  if (typeof delayMs !== 'number' || !Number.isInteger(delayMs) || delayMs < 0 || delayMs > 5000) {
    return undefined;
  }

  return { cids, delayMs };
}
