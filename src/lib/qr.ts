// A small QR code generator (byte mode, error correction level M, versions 1 to 10: up to 213 bytes,
// plenty for a web address). Written for this project so no extra package is needed.

// [data codewords, error-correction codewords per block, blocks as [count, data codewords each][]]
const VERSIONS: { ec: number; blocks: [number, number][] }[] = [
  { ec: 10, blocks: [[1, 16]] },
  { ec: 16, blocks: [[1, 28]] },
  { ec: 26, blocks: [[1, 44]] },
  { ec: 18, blocks: [[2, 32]] },
  { ec: 24, blocks: [[2, 43]] },
  { ec: 16, blocks: [[4, 27]] },
  { ec: 18, blocks: [[4, 31]] },
  {
    ec: 22,
    blocks: [
      [2, 38],
      [2, 39],
    ],
  },
  {
    ec: 22,
    blocks: [
      [3, 36],
      [2, 37],
    ],
  },
  {
    ec: 26,
    blocks: [
      [4, 43],
      [1, 44],
    ],
  },
];

const ALIGNMENT: number[][] = [
  [],
  [6, 18],
  [6, 22],
  [6, 26],
  [6, 30],
  [6, 34],
  [6, 22, 38],
  [6, 24, 42],
  [6, 26, 46],
  [6, 28, 50],
];

// Galois field GF(256) with the QR polynomial 0x11D
const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

const gfMul = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

function reedSolomon(data: number[], ecLength: number): number[] {
  // generator polynomial: (x - a^0)(x - a^1)...(x - a^(ecLength-1))
  let generator = [1];
  for (let i = 0; i < ecLength; i++) {
    const next = new Array<number>(generator.length + 1).fill(0);
    generator.forEach((coefficient, j) => {
      next[j] ^= coefficient;
      next[j + 1] ^= gfMul(coefficient, EXP[i]);
    });
    generator = next;
  }

  const remainder = new Array<number>(ecLength).fill(0);
  for (const byte of data) {
    const factor = byte ^ remainder[0];
    remainder.shift();
    remainder.push(0);
    for (let i = 0; i < ecLength; i++) remainder[i] ^= gfMul(generator[i + 1], factor);
  }
  return remainder;
}

const dataCapacity = (version: number) =>
  VERSIONS[version - 1].blocks.reduce((sum, [count, size]) => sum + count * size, 0);

function utf8Bytes(text: string): number[] {
  return Array.from(new TextEncoder().encode(text));
}

function buildCodewords(bytes: number[], version: number): number[] {
  const capacity = dataCapacity(version);
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1);
  };

  push(0b0100, 4); // byte mode
  push(bytes.length, version < 10 ? 8 : 16);
  bytes.forEach((b) => push(b, 8));
  push(0, Math.min(4, capacity * 8 - bits.length)); // terminator
  while (bits.length % 8 !== 0) bits.push(0);

  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  }
  for (let pad = 0; data.length < capacity; pad++) data.push(pad % 2 === 0 ? 0xec : 0x11);

  // split into blocks, add error correction, interleave
  const { ec, blocks } = VERSIONS[version - 1];
  const dataBlocks: number[][] = [];
  let offset = 0;
  blocks.forEach(([count, size]) => {
    for (let i = 0; i < count; i++) {
      dataBlocks.push(data.slice(offset, offset + size));
      offset += size;
    }
  });
  const ecBlocks = dataBlocks.map((block) => reedSolomon(block, ec));

  const result: number[] = [];
  const longest = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < longest; i++)
    dataBlocks.forEach((block) => i < block.length && result.push(block[i]));
  for (let i = 0; i < ec; i++) ecBlocks.forEach((block) => result.push(block[i]));
  return result;
}

const MASKS: ((x: number, y: number) => boolean)[] = [
  (x, y) => (x + y) % 2 === 0,
  (_x, y) => y % 2 === 0,
  (x) => x % 3 === 0,
  (x, y) => (x + y) % 3 === 0,
  (x, y) => (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0,
  (x, y) => ((x * y) % 2) + ((x * y) % 3) === 0,
  (x, y) => (((x * y) % 2) + ((x * y) % 3)) % 2 === 0,
  (x, y) => (((x + y) % 2) + ((x * y) % 3)) % 2 === 0,
];

function penalty(modules: boolean[][]): number {
  const size = modules.length;
  let score = 0;

  // rule 1: runs of five or more same-coloured modules in a row or column
  for (let a = 0; a < size; a++) {
    for (const horizontal of [true, false]) {
      let run = 1;
      for (let b = 1; b < size; b++) {
        const same = horizontal
          ? modules[a][b] === modules[a][b - 1]
          : modules[b][a] === modules[b - 1][a];
        if (same) {
          run++;
          if (run === 5) score += 3;
          else if (run > 5) score += 1;
        } else {
          run = 1;
        }
      }
    }
  }

  // rule 2: 2x2 blocks of one colour
  for (let y = 0; y < size - 1; y++) {
    for (let x = 0; x < size - 1; x++) {
      const c = modules[y][x];
      if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1])
        score += 3;
    }
  }

  // rule 3: patterns that look like a finder pattern
  const pattern = [true, false, true, true, true, false, true, false, false, false, false];
  const reverse = [...pattern].reverse();
  const matches = (read: (i: number) => boolean, p: boolean[]) =>
    p.every((value, i) => read(i) === value);
  for (let a = 0; a < size; a++) {
    for (let b = 0; b <= size - 11; b++) {
      for (const p of [pattern, reverse]) {
        if (matches((i) => modules[a][b + i], p)) score += 40;
        if (matches((i) => modules[b + i][a], p)) score += 40;
      }
    }
  }

  // rule 4: balance of dark and light modules
  const dark = modules.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

function bch(value: number, generator: number, generatorBits: number): number {
  let remainder = value;
  for (let i = 0; i < generatorBits; i++)
    remainder = (remainder << 1) ^ ((remainder >>> (generatorBits - 1)) * generator);
  return remainder;
}

export interface QrCode {
  size: number;
  version: number;
  modules: boolean[][]; // modules[row][column], true = dark
}

export function createQr(text: string): QrCode {
  const bytes = utf8Bytes(text);
  let version = 0;
  for (let v = 1; v <= 10; v++) {
    const headerBits = 4 + (v < 10 ? 8 : 16);
    if (headerBits + bytes.length * 8 <= dataCapacity(v) * 8) {
      version = v;
      break;
    }
  }
  if (version === 0) throw new Error('Text is too long for the QR code generator');

  const size = version * 4 + 17;
  const modules: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false)
  );
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    new Array<boolean>(size).fill(false)
  );
  const set = (x: number, y: number, dark: boolean) => {
    modules[y][x] = dark;
    isFunction[y][x] = true;
  };

  // timing patterns
  for (let i = 0; i < size; i++) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  // finder patterns with their separators
  const finder = (cx: number, cy: number) => {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx;
        const y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) set(x, y, distance !== 2 && distance !== 4);
      }
    }
  };
  finder(3, 3);
  finder(size - 4, 3);
  finder(3, size - 4);

  // alignment patterns
  const positions = ALIGNMENT[version - 1];
  positions.forEach((cy, i) =>
    positions.forEach((cx, j) => {
      const nearFinder =
        (i === 0 && j === 0) ||
        (i === 0 && j === positions.length - 1) ||
        (i === positions.length - 1 && j === 0);
      if (nearFinder) return;
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          set(cx + dx, cy + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
    })
  );

  // reserve the format and version areas (the real bits are written after masking)
  const drawFormat = (mask: number) => {
    const data = (0 << 3) | mask; // error correction level M = 00
    const bits = ((data << 10) | bch(data, 0x537, 10)) ^ 0x5412;
    const bit = (i: number) => ((bits >>> i) & 1) === 1;
    for (let i = 0; i <= 5; i++) set(8, i, bit(i));
    set(8, 7, bit(6));
    set(8, 8, bit(7));
    set(7, 8, bit(8));
    for (let i = 9; i < 15; i++) set(14 - i, 8, bit(i));
    for (let i = 0; i < 8; i++) set(size - 1 - i, 8, bit(i));
    for (let i = 8; i < 15; i++) set(8, size - 15 + i, bit(i));
    set(8, size - 8, true); // the always-dark module
  };
  drawFormat(0);

  if (version >= 7) {
    const bits = (version << 12) | bch(version, 0x1f25, 12);
    for (let i = 0; i < 18; i++) {
      const dark = ((bits >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, dark);
      set(b, a, dark);
    }
  }

  // place the data bits in the zig-zag pattern
  const codewords = buildCodewords(bytes, version);
  let bitIndex = 0;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let vertical = 0; vertical < size; vertical++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j;
        const upward = ((right + 1) & 2) === 0;
        const y = upward ? size - 1 - vertical : vertical;
        if (!isFunction[y][x] && bitIndex < codewords.length * 8) {
          modules[y][x] = ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) === 1;
          bitIndex++;
        }
      }
    }
  }

  // choose the mask with the lowest penalty
  const applyMask = (mask: number) => {
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++)
        if (!isFunction[y][x] && MASKS[mask](x, y)) modules[y][x] = !modules[y][x];
  };
  let best = 0;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    applyMask(mask);
    drawFormat(mask);
    const score = penalty(modules);
    if (score < bestScore) {
      best = mask;
      bestScore = score;
    }
    applyMask(mask); // undo
  }
  applyMask(best);
  drawFormat(best);

  return { size, version, modules };
}

// SVG markup for the code, with the standard four-module quiet zone
export function qrToSvg(
  qr: QrCode,
  options: { dark?: string; light?: string; margin?: number } = {}
): string {
  const { dark = '#000000', light = '#ffffff', margin = 4 } = options;
  const total = qr.size + margin * 2;
  let path = '';
  qr.modules.forEach((row, y) =>
    row.forEach((cell, x) => {
      if (cell) path += `M${x + margin} ${y + margin}h1v1h-1z`;
    })
  );
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><rect width="${total}" height="${total}" fill="${light}"/><path d="${path}" fill="${dark}"/></svg>`;
}
