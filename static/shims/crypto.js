// Browser stand-in for the parts of node:crypto the fortune libs use,
// backed by the Web Crypto CSPRNG (crypto.getRandomValues).

const webCrypto = globalThis.crypto;

function randomUint32() {
  const buf = new Uint32Array(1);
  webCrypto.getRandomValues(buf);
  return buf[0];
}

// Same contract as node:crypto.randomInt([min,] max): uniform integer in [min, max).
function randomInt(min, max) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  const range = max - min;
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max) || range <= 0 || range > 0xffffffff) {
    throw new RangeError(`randomInt: invalid range [${min}, ${max})`);
  }
  // Rejection sampling avoids modulo bias.
  const limit = 0x100000000 - (0x100000000 % range);
  let x;
  do {
    x = randomUint32();
  } while (x >= limit);
  return min + (x % range);
}

function randomBytes(size) {
  const bytes = new Uint8Array(size);
  webCrypto.getRandomValues(bytes);
  return {
    length: size,
    toString(encoding = 'hex') {
      if (encoding !== 'hex') throw new Error(`randomBytes shim only supports hex, got ${encoding}`);
      return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    },
  };
}

function randomUUID() {
  if (typeof webCrypto.randomUUID === 'function') return webCrypto.randomUUID();
  const b = new Uint8Array(16);
  webCrypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const hex = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

module.exports = { randomInt, randomBytes, randomUUID };
