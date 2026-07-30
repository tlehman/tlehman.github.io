// solver.js — a from-scratch layer-by-layer solver.
//
// First two layers: each piece is placed by a breadth-first search over a
// *reduced* state (only the pieces we care about), so the search stays tiny and
// always finds a short maneuver that preserves already-solved pieces.
//
// Last layer: classic, verified algorithms driven by a greedy loop that keeps
// applying the right setup + algorithm until each sub-goal is reached.
//
// solve(state) -> array of move tokens that turns `state` into the solved cube.

import { move, applySeq, tokens, isSolved, simplify, toFacelets } from "./cube.js";

// Faces clockwise around the U axis (looking down): F -> R -> B -> L -> F.
const RIGHT_OF = { F: "R", R: "B", B: "L", L: "F" };
const LEFT_OF = { F: "L", L: "B", B: "R", R: "F" };
// U-layer edge slot whose outer sticker faces the given side.
const U_SLOT_FACING = { R: 0, F: 1, L: 2, B: 3 };
// Middle slot (cubie index) -> the side face it is the front-right of.
const MID_FRONT = { 8: "F", 9: "L", 10: "B", 11: "R" };
// Insert the edge sitting at the U-slot facing Z (outer sticker = Z) into Z's
// front-right slot (RIGHT) or front-left slot (LEFT).
const RIGHT = (Z) => `U ${RIGHT_OF[Z]} U' ${RIGHT_OF[Z]}' U' ${Z}' U ${Z}`;
const LEFT = (Z) => `U' ${LEFT_OF[Z]}' U ${LEFT_OF[Z]} U ${Z} U' ${Z}'`;
const FACE_INDEX = { U: 0, R: 1, F: 2, D: 3, L: 4, B: 5 };
const EDGE_FACELET = [[5, 10], [7, 19], [3, 37], [1, 46], [32, 16], [28, 25], [30, 43], [34, 52], [23, 12], [21, 41], [50, 39], [48, 14]];

const ALL_MOVES = ["U", "U'", "U2", "R", "R'", "R2", "F", "F'", "F2", "D", "D'", "D2", "L", "L'", "L2", "B", "B'", "B2"];

// BFS for a maneuver that satisfies `constraints`, tracking only those pieces.
// constraints: [{e, slot, ori} | {c, slot, ori}]  (e = edge cubie, c = corner cubie)
function maneuver(start, constraints, maxDepth = 9) {
  const key = (st) => {
    let k = "";
    for (const cn of constraints) {
      if (cn.e !== undefined) { const p = st.ep.indexOf(cn.e); k += "e" + p + "." + st.eo[p] + ";"; }
      else { const p = st.cp.indexOf(cn.c); k += "c" + p + "." + st.co[p] + ";"; }
    }
    return k;
  };
  const goal = (st) => constraints.every((cn) =>
    cn.e !== undefined
      ? st.ep[cn.slot] === cn.e && st.eo[cn.slot] === cn.ori
      : st.cp[cn.slot] === cn.c && st.co[cn.slot] === cn.ori
  );
  if (goal(start)) return [];
  const seen = new Set([key(start)]);
  let frontier = [{ s: start, path: [] }];
  for (let d = 0; d < maxDepth; d++) {
    const next = [];
    for (const node of frontier) {
      const last = node.path.length ? node.path[node.path.length - 1][0] : "";
      for (const mv of ALL_MOVES) {
        if (mv[0] === last) continue; // never two turns of the same face in a row
        const ns = move(node.s, mv);
        const kk = key(ns);
        if (seen.has(kk)) continue;
        seen.add(kk);
        const np = node.path.concat(mv);
        if (goal(ns)) return np;
        next.push({ s: ns, path: np });
      }
    }
    frontier = next;
  }
  throw new Error("maneuver not found (depth " + maxDepth + ")");
}

// --- Last layer algorithms (verified in test.js against the engine) ---------
const EDGE_ORIENT = "F R U R' U' F'";          // makes the U cross
const SUNE = "R U R' U R U2 R'";               // corner orientation
const ANTISUNE = "R U2 R' U' R U' R'";
const A_PERM = "R' F R' B2 R F' R' B2 R2";     // 3-cycle of U corners, edges fixed
const A_PERM_I = "R2 B2 R F R' B2 R F' R";     // inverse direction
const U_PERM_A = "R U' R U R U R U' R' U' R2"; // 3-cycle of U edges
const U_PERM_B = "R2 U R U R' U' R' U' R' U R'";

export function solve(start) {
  let s = { cp: start.cp.slice(), co: start.co.slice(), ep: start.ep.slice(), eo: start.eo.slice() };
  const out = [];
  const apply = (seq) => {
    for (const t of tokens(seq)) { s = move(s, t); out.push(t); }
  };

  // 1) White cross (D edges), placed one at a time, each preserving the rest.
  const cross = [];
  for (const c of [5, 4, 7, 6]) {        // DF DR DB DL
    cross.push({ e: c, slot: c, ori: 0 });
    apply(maneuver(s, cross));
  }

  // 2) First-layer corners.
  const layer1 = cross.slice();
  for (const c of [4, 5, 6, 7]) {        // DFR DLF DBL DRB
    layer1.push({ c, slot: c, ori: 0 });
    apply(maneuver(s, layer1));
  }

  // 3) Middle-layer edges -> first two layers complete. Done with explicit
  //    right/left inserts (BFS here would track 12 pieces and blow up).
  const midSolved = (c) => s.ep[c] === c && s.eo[c] === 0;
  let guard = 0;
  while (![8, 9, 10, 11].every(midSolved)) {
    if (++guard > 30) throw new Error("middle layer stuck");
    // A middle cubie sitting in the U layer?
    let p = -1;
    for (let q = 0; q < 4; q++) { const c = s.ep[q]; if (c >= 8 && c <= 11) { p = q; break; } }
    if (p >= 0) {
      const fl = toFacelets(s);
      const c = s.ep[p];
      const side = fl[EDGE_FACELET[p][1]]; // outer sticker color (a face letter)
      const top = fl[EDGE_FACELET[p][0]];  // up-facing sticker color
      // Rotate U until the cubie's outer sticker faces its own center.
      let k = 0;
      while (s.ep[U_SLOT_FACING[side]] !== c) { apply("U"); if (++k > 4) break; }
      apply(RIGHT_OF[side] === top ? RIGHT(side) : LEFT(side));
    } else {
      // All remaining middle cubies are stuck in middle slots; eject one.
      for (let slot = 8; slot <= 11; slot++) {
        if (!midSolved(slot)) { apply(RIGHT(MID_FRONT[slot])); break; }
      }
    }
  }

  // 4) Last layer, in four steps. Each step searches over short sequences of
  //    "(rotate U) + algorithm" until its sub-goal holds. Searching (rather
  //    than greedily improving a count) handles cases where an algorithm makes
  //    progress without immediately improving the score (e.g. the cross alg
  //    turns an L into a line before a line into the cross).
  const SETUPS = ["", "U", "U2", "U'"];
  function reach(predicate, algs, maxDepth, label) {
    if (predicate(s)) return;
    let frontier = [{ st: s, path: [] }];
    const seen = new Set([toFacelets(s)]);
    for (let d = 0; d < maxDepth; d++) {
      const next = [];
      for (const node of frontier) {
        for (const setup of SETUPS) {
          for (const alg of algs) {
            const seq = (setup + " " + alg).trim();
            let t = node.st;
            for (const tok of tokens(seq)) t = move(t, tok);
            const key = toFacelets(t);
            if (seen.has(key)) continue;
            seen.add(key);
            const path = seq ? node.path.concat(tokens(seq)) : node.path;
            if (predicate(t)) { for (const tok of path) apply(tok); return; }
            next.push({ st: t, path });
          }
        }
      }
      frontier = next;
    }
    throw new Error("last-layer search failed: " + label);
  }

  const uEdgesOriented = (st) => [0, 1, 2, 3].every((p) => st.eo[p] === 0);
  const uCornersOriented = (st) => [0, 1, 2, 3].every((p) => st.co[p] === 0);
  const uCornersPlaced = (st) => [0, 1, 2, 3].every((p) => st.cp[p] === p);

  reach(uEdgesOriented, [EDGE_ORIENT], 4, "edge-orient");
  reach(uCornersOriented, [SUNE, ANTISUNE], 6, "corner-orient");
  reach(uCornersPlaced, [A_PERM, A_PERM_I], 4, "corner-permute");
  reach(isSolved, [U_PERM_A, U_PERM_B, ""], 5, "edge-permute");

  return simplify(out);
}
