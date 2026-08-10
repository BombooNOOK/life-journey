/**
 * ULID-ish Crockford base32 ids for Local-first stableId (PoC).
 * Time-sortable, no new dependency. Not a byte-perfect ULID library clone.
 */

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

function encodeTime(ms: number, length: number): string {
  let value = ms;
  let out = "";
  for (let i = 0; i < length; i += 1) {
    const mod = value % 32;
    out = CROCKFORD[mod]! + out;
    value = Math.floor(value / 32);
  }
  return out;
}

function encodeRandom(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += CROCKFORD[bytes[i]! % 32]!;
  }
  return out;
}

/** 26-char Crockford ULID-compatible string for Local Journal stableId */
export function createLocalStableId(): string {
  return `${encodeTime(Date.now(), 10)}${encodeRandom(16)}`;
}
