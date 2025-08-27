// functions/infra/qr/QrSvg.ts
// QR v1-L (21x21), Byte mode, mask 0. Suficiente para urls cortas tipo https://ecv.lat/xxx
// Implementación mínima (EC: 7 codewords). MIT.

type Matrix = number[][];
const SIZE = 21;              // Version 1
const EC_LEN = 7;             // L → 7 codewords
const MODE_BYTE = 0b0100;     // Byte mode indicator
const MASK = 0;               // Mask pattern 0 ( (r+c)%2==0 )

// Galois GF(256) primitive poly 0x11d for RS
const GF_EXP: number[] = new Array(512);
const GF_LOG: number[] = new Array(256);

(function initGF() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    GF_EXP[i] = x;
    GF_LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) GF_EXP[i] = GF_EXP[i - 255];
})();

function gfMul(a: number, b: number) {
  if (a === 0 || b === 0) return 0;
  return GF_EXP[(GF_LOG[a] + GF_LOG[b]) % 255];
}

function rsGeneratorPoly(deg: number): number[] {
  let poly = [1];
  for (let i = 0; i < deg; i++) {
    const mult = [1, GF_EXP[i]];
    const next: number[] = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= gfMul(poly[j], mult[0]);
      next[j + 1] ^= gfMul(poly[j], mult[1]);
    }
    poly = next;
  }
  return poly;
}

function rsEncode(data: number[], ecLen: number): number[] {
  const gen = rsGeneratorPoly(ecLen);
  const res = new Array(ecLen).fill(0);
  for (const d of data) {
    const factor = d ^ res[0];
    res.shift();
    res.push(0);
    for (let i = 0; i < gen.length; i++) {
      res[i] ^= gfMul(gen[i], factor);
    }
  }
  return res;
}

// Bit buffer helper
class BitBuf {
  bits: number[] = [];
  push(val: number, len: number) {
    for (let i = len - 1; i >= 0; i--) this.bits.push((val >> i) & 1);
  }
  toBytes(): number[] {
    const out: number[] = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let b = 0;
      for (let j = 0; j < 8; j++) b = (b << 1) | (this.bits[i + j] || 0);
      out.push(b);
    }
    return out;
  }
}

// Build payload for version 1-L (capacity: 19 data codewords)
function buildDataBytes(s: string): number[] {
  const enc = new TextEncoder().encode(s);
  const bb = new BitBuf();
  // mode
  bb.push(MODE_BYTE, 4);
  // char count for version 1 in byte mode → 8 bits
  bb.push(enc.length, 8);
  // data
  for (const b of enc) bb.push(b, 8);
  // terminator (4 bits) + pad to byte
  const totalDataBytes = 19;
  const neededBits = totalDataBytes * 8;
  const remain = neededBits - bb.bits.length;
  if (remain > 0) {
    const term = Math.min(4, remain);
    bb.push(0, term);
  }
  while (bb.bits.length % 8 !== 0) bb.push(0, 1);
  let data = bb.toBytes();
  while (data.length < totalDataBytes) {
    data.push(0xec, 0x11);
  }
  data = data.slice(0, totalDataBytes);
  return data;
}

// Place fixed patterns (finders, timing)
function initMatrix(): Matrix {
  const m: Matrix = Array.from({ length: SIZE }, () => Array(SIZE).fill(-1));
  const placeFinder = (r: number, c: number) => {
    for (let i = -1; i <= 7; i++) {
      for (let j = -1; j <= 7; j++) {
        const rr = r + i, cc = c + j;
        if (rr < 0 || rr >= SIZE || cc < 0 || cc >= SIZE) continue;
        const isBorder = i === -1 || j === -1 || i === 7 || j === 7;
        const isSquare = i >= 0 && i <= 6 && j >= 0 && j <= 6;
        const isCenter = i >= 2 && i <= 4 && j >= 2 && j <= 4;
        m[rr][cc] = isSquare ? (isCenter ? 1 : isBorder ? 0 : 1) : 0;
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, SIZE - 7);
  placeFinder(SIZE - 7, 0);

  // Timing patterns
  for (let i = 8; i < SIZE - 8; i++) {
    m[6][i] = i % 2 === 0 ? 1 : 0;
    m[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // dark module (version info area) — for v1 not used, but set at (8, SIZE-8) = (8,13) → fixed 1
  m[SIZE - 8][8] = 1;

  return m;
}

// Write data zig-zag with mask 0
function writeData(m: Matrix, bytes: number[]) {
  const bits: number[] = [];
  for (const b of bytes) for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);

  // positions to skip (function patterns)
  const isFunc = (r: number, c: number) => m[r][c] !== -1;

  let dirUp = true;
  let col = SIZE - 1;
  let bi = 0;
  while (col > 0) {
    if (col === 6) col--; // skip timing column
    for (let i = 0; i < SIZE; i++) {
      const row = dirUp ? SIZE - 1 - i : i;
      for (let dc = 0; dc < 2; dc++) {
        const c = col - dc;
        if (isFunc(row, c)) continue;
        let v = bits[bi++] ?? 0;
        // mask 0: (r+c) % 2 === 0 → invert
        if ((row + c) % 2 === 0) v ^= 1;
        m[row][c] = v;
        if (bi >= bits.length) {
          // fill remaining with masked 0
          // (not strictly necessary cuando ya completamos)
        }
      }
    }
    dirUp = !dirUp;
    col -= 2;
  }
}

// Format info for (L, mask 0) → 0b111011111000100  (precalculado)
function placeFormatInfo(m: Matrix) {
  const formatBits = 0b111011111000100;
  // top-left around
  for (let i = 0; i < 6; i++) m[i][8] = (formatBits >> i) & 1;
  m[7][8] = (formatBits >> 6) & 1;
  m[8][8] = (formatBits >> 7) & 1;
  m[8][7] = (formatBits >> 8) & 1;
  for (let i = 9; i < 15; i++) m[8][14 - i + 9] = (formatBits >> i) & 1;

  // top-right & bottom-left
  for (let i = 0; i < 8; i++) m[8][SIZE - 1 - i] = (formatBits >> i) & 1;
  for (let i = 0; i < 7; i++) m[SIZE - 1 - i][8] = (formatBits >> i) & 1;
}

function matrixToSvg(m: Matrix, scale = 6, margin = 2): string {
  const dim = (SIZE + margin * 2) * scale;
  let rects = `<rect width="${dim}" height="${dim}" fill="#fff"/>`;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (m[r][c] === 1) {
        const x = (c + margin) * scale;
        const y = (r + margin) * scale;
        rects += `<rect x="${x}" y="${y}" width="${scale}" height="${scale}" fill="#000"/>`;
      }
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges">${rects}</svg>`;
}

export function QrSvg(data: string): string {
  const m = initMatrix();
  const dataBytes = buildDataBytes(data);
  const ecBytes = rsEncode(dataBytes, EC_LEN);
  const all = dataBytes.concat(ecBytes);
  writeData(m, all);
  placeFormatInfo(m);
  return matrixToSvg(m);
}
