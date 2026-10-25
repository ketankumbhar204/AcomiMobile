type RandomBytes = {
  getRandomValues: <T extends ArrayBufferView>(array: T) => T;
};

/**
 * Prefers Web Crypto. This React Native build does not expose it, so the
 * fallback is a seeded generator that still does not use Math.random.
 */
export function randomUint32(): number {
  const cryptoObj = readCrypto();
  if (cryptoObj) {
    const buf = new Uint32Array(1);
    cryptoObj.getRandomValues(buf);
    return buf[0] ?? 0;
  }
  return fallbackUint32();
}

function readCrypto(): RandomBytes | null {
  const scope = globalThis as { crypto?: RandomBytes; msCrypto?: RandomBytes };
  const candidate = scope.crypto ?? scope.msCrypto;
  if (candidate && typeof candidate.getRandomValues === 'function') {
    return candidate;
  }
  return null;
}

function rotl(value: number, shift: number): number {
  return ((value << shift) | (value >>> (32 - shift))) >>> 0;
}

function mix(left: number, right: number): number {
  return Math.imul(left ^ right, 0x9e3779b1) >>> 0;
}

let seeded = false;
let s0 = 0;
let s1 = 0;
let s2 = 0;
let s3 = 0;

function seedFallback(): void {
  let a = 0x6d2b79f5;
  let b = 0x1b873593;
  let c = 0x9e3779b9;
  let d = 0x85ebca6b;
  const started = globalThis.performance?.now?.() ?? 0;
  for (let i = 0; i < 32; i += 1) {
    const sample = globalThis.performance?.now?.() ?? started;
    a = mix(a, Math.floor(sample * 1e6) >>> 0);
    b = mix(b, a ^ i);
    c = mix(c, b);
    d = mix(d, c);
  }
  s0 = a || 0x6d2b79f5;
  s1 = b || 0x1b873593;
  s2 = c || 0x9e3779b9;
  s3 = d || 0x85ebca6b;
  seeded = true;
}

function fallbackUint32(): number {
  if (!seeded) {
    seedFallback();
  }
  const result = Math.imul(rotl(Math.imul(s1, 5) >>> 0, 7), 9) >>> 0;
  const t = (s1 << 9) >>> 0;
  s2 ^= s0;
  s3 ^= s1;
  s1 ^= s2;
  s0 ^= s3;
  s2 ^= t;
  s3 = rotl(s3, 11);
  return result >>> 0;
}
