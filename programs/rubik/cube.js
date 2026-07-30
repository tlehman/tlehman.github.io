// cube.js — Rubik's cube model (cubie level) + facelet conversion.
//
// Pieces are tracked at the cubie level: 8 corners and 12 edges, each with a
// permutation (which cubie sits at a slot) and an orientation. This makes the
// solver easy to reason about ("where is the white-green edge?"). For display
// and for scanning we convert to/from the 54-facelet representation.
//
// Slot orderings follow the classic Kociemba convention:
//   Corners: URF UFL ULB UBR DFR DLF DBL DRB   (0..7)
//   Edges:   UR  UF  UL  UB  DR  DF  DL  DB  FR FL BL BR  (0..11)
//   Facelets: U(0..8) R(9..17) F(18..26) D(27..35) L(36..44) B(45..53)
//
// Color scheme (Western / BOY): U=yellow, D=white, F=green, B=blue, R=red, L=orange.

export const FACES = ["U", "R", "F", "D", "L", "B"];

// Each basic move as a cubie permutation + orientation delta.
const MOVES = {
  U: {
    cp: [3, 0, 1, 2, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [3, 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  R: {
    cp: [4, 1, 2, 0, 7, 5, 6, 3], co: [2, 0, 0, 1, 1, 0, 0, 2],
    ep: [8, 1, 2, 3, 11, 5, 6, 7, 4, 9, 10, 0], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  F: {
    cp: [1, 5, 2, 3, 0, 4, 6, 7], co: [1, 2, 0, 0, 2, 1, 0, 0],
    ep: [0, 9, 2, 3, 4, 8, 6, 7, 1, 5, 10, 11], eo: [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0],
  },
  D: {
    cp: [0, 1, 2, 3, 5, 6, 7, 4], co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 5, 6, 7, 4, 8, 9, 10, 11], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  L: {
    cp: [0, 2, 6, 3, 4, 1, 5, 7], co: [0, 1, 2, 0, 0, 2, 1, 0],
    ep: [0, 1, 10, 3, 4, 5, 9, 7, 8, 2, 6, 11], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  },
  B: {
    cp: [0, 1, 3, 7, 4, 5, 2, 6], co: [0, 0, 1, 2, 0, 0, 2, 1],
    ep: [0, 1, 2, 11, 4, 5, 6, 10, 8, 9, 3, 7], eo: [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 1, 1],
  },
};

// Which facelets belong to each corner/edge slot, ordered so index 0 is the
// U/D facelet (used to read orientation).
const CORNER_FACELET = [
  [8, 9, 20],  // URF
  [6, 18, 38], // UFL
  [0, 36, 47], // ULB
  [2, 45, 11], // UBR
  [29, 26, 15],// DFR
  [27, 44, 24],// DLF
  [33, 53, 42],// DBL
  [35, 17, 51],// DRB
];
const EDGE_FACELET = [
  [5, 10],  // UR
  [7, 19],  // UF
  [3, 37],  // UL
  [1, 46],  // UB
  [32, 16], // DR
  [28, 25], // DF
  [30, 43], // DL
  [34, 52], // DB
  [23, 12], // FR
  [21, 41], // FL
  [50, 39], // BL
  [48, 14], // BR
];

// Home colors (face letters) of each cubie, derived from the solved cube.
const CORNER_COLOR = CORNER_FACELET.map((fs) => fs.map((f) => FACES[Math.floor(f / 9)]));
const EDGE_COLOR = EDGE_FACELET.map((fs) => fs.map((f) => FACES[Math.floor(f / 9)]));

export function solved() {
  return {
    cp: [0, 1, 2, 3, 4, 5, 6, 7], co: [0, 0, 0, 0, 0, 0, 0, 0],
    ep: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], eo: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  };
}

export function clone(s) {
  return { cp: s.cp.slice(), co: s.co.slice(), ep: s.ep.slice(), eo: s.eo.slice() };
}

export function isSolved(s) {
  for (let i = 0; i < 8; i++) if (s.cp[i] !== i || s.co[i] !== 0) return false;
  for (let i = 0; i < 12; i++) if (s.ep[i] !== i || s.eo[i] !== 0) return false;
  return true;
}

function applyBasic(s, m) {
  const r = { cp: new Array(8), co: new Array(8), ep: new Array(12), eo: new Array(12) };
  for (let i = 0; i < 8; i++) {
    r.cp[i] = s.cp[m.cp[i]];
    r.co[i] = (s.co[m.cp[i]] + m.co[i]) % 3;
  }
  for (let i = 0; i < 12; i++) {
    r.ep[i] = s.ep[m.ep[i]];
    r.eo[i] = (s.eo[m.ep[i]] + m.eo[i]) % 2;
  }
  return r;
}

// Apply a single move token like "R", "R'", "R2".
export function move(s, token) {
  const face = token[0];
  const m = MOVES[face];
  if (!m) throw new Error("bad move: " + token);
  const times = token[1] === "2" ? 2 : token[1] === "'" ? 3 : 1;
  let r = s;
  for (let i = 0; i < times; i++) r = applyBasic(r, m);
  return r;
}

// Apply a space-separated sequence; returns the new state.
export function applySeq(s, seq) {
  let r = s;
  for (const t of tokens(seq)) r = move(r, t);
  return r;
}

export function tokens(seq) {
  if (Array.isArray(seq)) return seq.filter(Boolean);
  return seq.trim().split(/\s+/).filter(Boolean);
}

export function invertSeq(seq) {
  const inv = (t) => (t.length === 1 ? t + "'" : t[1] === "'" ? t[0] : t);
  return tokens(seq).reverse().map(inv);
}

// Collapse redundant moves (e.g. "R R" -> "R2", "R R'" -> "") for tidy output.
export function simplify(seq) {
  let arr = tokens(seq).slice();
  let changed = true;
  const amount = (t) => (t.length === 1 ? 1 : t[1] === "2" ? 2 : 3);
  const fromAmount = (f, a) => (a % 4 === 0 ? null : a % 4 === 1 ? f : a % 4 === 2 ? f + "2" : f + "'");
  while (changed) {
    changed = false;
    const out = [];
    for (const t of arr) {
      if (out.length && out[out.length - 1][0] === t[0]) {
        const a = (amount(out.pop()) + amount(t)) % 4;
        const merged = fromAmount(t[0], a);
        if (merged) out.push(merged);
        changed = true;
      } else {
        out.push(t);
      }
    }
    arr = out;
  }
  return arr;
}

const ALL_MOVES = ["U", "U'", "U2", "R", "R'", "R2", "F", "F'", "F2", "D", "D'", "D2", "L", "L'", "L2", "B", "B'", "B2"];

// Deterministic pseudo-random scramble of `n` moves (seeded for reproducibility).
export function scramble(n = 25, seed = 1) {
  let x = seed >>> 0 || 1;
  const rnd = () => {
    x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
  const out = [];
  let lastFace = "";
  for (let i = 0; i < n; i++) {
    let t;
    do { t = ALL_MOVES[Math.floor(rnd() * ALL_MOVES.length)]; } while (t[0] === lastFace);
    lastFace = t[0];
    out.push(t);
  }
  return out;
}

// --- Facelet conversion -----------------------------------------------------

// Cubie state -> 54-char facelet string of face letters (URFDLB order).
export function toFacelets(s) {
  const f = new Array(54);
  // centers
  for (let i = 0; i < 6; i++) f[i * 9 + 4] = FACES[i];
  for (let p = 0; p < 8; p++) {
    const c = s.cp[p], o = s.co[p];
    for (let k = 0; k < 3; k++) {
      f[CORNER_FACELET[p][(k + o) % 3]] = CORNER_COLOR[c][k];
    }
  }
  for (let p = 0; p < 12; p++) {
    const e = s.ep[p], o = s.eo[p];
    for (let k = 0; k < 2; k++) {
      f[EDGE_FACELET[p][(k + o) % 2]] = EDGE_COLOR[e][k];
    }
  }
  return f.join("");
}

// 54-char facelet string -> cubie state. Throws if the stickers don't form a
// valid cube. Used to ingest a scanned cube.
export function fromFacelets(str) {
  if (str.length !== 54) throw new Error("need 54 facelets, got " + str.length);
  const f = str.split("");
  const s = { cp: new Array(8), co: new Array(8), ep: new Array(12), eo: new Array(12) };

  const cornerKey = (arr) => arr.slice().sort().join("");
  const cornerLookup = {};
  for (let c = 0; c < 8; c++) cornerLookup[cornerKey(CORNER_COLOR[c])] = c;
  const edgeLookup = {};
  for (let e = 0; e < 12; e++) edgeLookup[EDGE_COLOR[e].slice().sort().join("")] = e;

  for (let p = 0; p < 8; p++) {
    const cols = CORNER_FACELET[p].map((i) => f[i]);
    const c = cornerLookup[cornerKey(cols)];
    if (c === undefined) throw new Error("invalid corner at slot " + p);
    // orientation: how many twists until U/D facelet (CORNER_COLOR[c][0]) lines up
    let o = 0;
    const ud = CORNER_COLOR[c][0]; // the U or D colored sticker
    for (let k = 0; k < 3; k++) if (cols[k] === ud) o = k;
    s.cp[p] = c; s.co[p] = o;
  }
  for (let p = 0; p < 12; p++) {
    const cols = EDGE_FACELET[p].map((i) => f[i]);
    const e = edgeLookup[cols.slice().sort().join("")];
    if (e === undefined) throw new Error("invalid edge at slot " + p);
    const o = cols[0] === EDGE_COLOR[e][0] ? 0 : 1;
    s.ep[p] = e; s.eo[p] = o;
  }
  return s;
}

// Validate basic permutation parity / orientation sums of a cubie state.
export function validate(s) {
  const cpSet = new Set(s.cp), epSet = new Set(s.ep);
  if (cpSet.size !== 8) return "corner pieces repeated or missing";
  if (epSet.size !== 12) return "edge pieces repeated or missing";
  if (s.co.reduce((a, b) => a + b, 0) % 3 !== 0) return "corner twist parity wrong (a corner is twisted)";
  if (s.eo.reduce((a, b) => a + b, 0) % 2 !== 0) return "edge flip parity wrong (an edge is flipped)";
  const parity = (arr) => {
    let p = 0;
    for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++) if (arr[i] > arr[j]) p ^= 1;
    return p;
  };
  if (parity(s.cp) !== parity(s.ep)) return "permutation parity wrong (two pieces swapped)";
  return null;
}
