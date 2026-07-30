// test.js — run with `bun test.js`. Verifies the cube engine and solver
// against thousands of random scrambles.
import * as C from "./cube.js";
import { solve } from "./solver.js";

let failures = 0;
function check(cond, msg) {
  if (!cond) { console.error("FAIL:", msg); failures++; }
}

// --- Engine sanity ----------------------------------------------------------
check(C.isSolved(C.solved()), "solved cube is solved");

// Each face 4x = identity
for (const f of ["U", "R", "F", "D", "L", "B"]) {
  let s = C.solved();
  for (let i = 0; i < 4; i++) s = C.move(s, f);
  check(C.isSolved(s), `${f} x4 == identity`);
}

// move then inverse == identity
for (const t of ["R", "U'", "F2", "L", "B'", "D2"]) {
  let s = C.applySeq(C.solved(), [t]);
  s = C.applySeq(s, C.invertSeq([t]));
  check(C.isSolved(s), `${t} then inverse == identity`);
}

// (R U R' U') x6 == identity (classic six-move identity)
{
  let s = C.solved();
  for (let i = 0; i < 6; i++) s = C.applySeq(s, "R U R' U'");
  check(C.isSolved(s), "(R U R' U')x6 == identity");
}

// facelet round trip
for (let seed = 1; seed <= 200; seed++) {
  const scr = C.scramble(20, seed);
  const s = C.applySeq(C.solved(), scr);
  const fl = C.toFacelets(s);
  const back = C.fromFacelets(fl);
  check(C.toFacelets(back) === fl, `facelet roundtrip seed ${seed}`);
  check(C.validate(back) === null, `scrambled cube validates seed ${seed}`);
}

// solved facelet string is the canonical one
check(
  C.toFacelets(C.solved()) ===
    "UUUUUUUUU" + "RRRRRRRRR" + "FFFFFFFFF" + "DDDDDDDDD" + "LLLLLLLLL" + "BBBBBBBBB",
  "solved facelets canonical"
);

// --- Solver -----------------------------------------------------------------
let maxLen = 0, total = 0, n = 0;
const N = 500;
for (let seed = 1; seed <= N; seed++) {
  const scr = C.scramble(25, seed);
  const start = C.applySeq(C.solved(), scr);
  let sol;
  try {
    sol = solve(start);
  } catch (e) {
    check(false, `solver threw seed ${seed}: ${e.message}`);
    continue;
  }
  const end = C.applySeq(start, sol);
  const ok = C.isSolved(end);
  check(ok, `solve seed ${seed} (len ${sol.length})`);
  if (ok) { maxLen = Math.max(maxLen, sol.length); total += sol.length; n++; }
}

console.log(`\nSolved ${n}/${N} scrambles. avg moves ${(total / n).toFixed(1)}, max ${maxLen}.`);
if (failures === 0) console.log("ALL PASS ✅");
else { console.error(`\n${failures} FAILURES ❌`); process.exit(1); }
