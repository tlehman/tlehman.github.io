// app.js — wires the scanner, the editable net, and the solver together.
import * as Cube from "./cube.js";
import { solve } from "./solver.js";
import { startCamera, stopCamera, sampleFace, classify } from "./scan.js";

const FACE_ORDER = ["U", "R", "F", "D", "L", "B"]; // facelet-string order
const COLOR = { U: "#fee100", R: "#c41e3a", F: "#009e60", D: "#ffffff", L: "#ff5800", B: "#0051ba" };

// net[face] = array of 9 face letters (reading order). Start solved.
const net = {};
for (const f of FACE_ORDER) net[f] = Array(9).fill(f);

let selected = "U";          // palette colour being painted
let solutionShown = false;

// ---- Build the unfolded-cross net -----------------------------------------
const netEl = document.getElementById("net");
const stickerEls = {};       // face -> [9 elements]
for (const f of FACE_ORDER) {
  const face = document.createElement("div");
  face.className = "face";
  face.dataset.pos = f;
  stickerEls[f] = [];
  for (let i = 0; i < 9; i++) {
    const st = document.createElement("div");
    st.className = "sticker" + (i === 4 ? " center" : "");
    st.dataset.face = f; st.dataset.idx = i;
    if (i !== 4) st.addEventListener("click", () => paint(f, i));
    face.appendChild(st);
    stickerEls[f].push(st);
  }
  const label = document.createElement("div");
  label.className = "face-label";
  label.textContent = { U: "Up", R: "Right", F: "Front", D: "Down", L: "Left", B: "Back" }[f];
  face.appendChild(label);
  netEl.appendChild(face);
}

function renderNet(lettersByFace) {
  for (const f of FACE_ORDER) {
    for (let i = 0; i < 9; i++) stickerEls[f][i].style.background = COLOR[lettersByFace[f][i]];
  }
}
renderNet(net);

function paint(f, i) {
  if (solutionShown) { exitSolution(); }      // resume editing
  net[f][i] = selected;
  stickerEls[f][i].style.background = COLOR[selected];
  setStatus("");
}

// ---- Palette ---------------------------------------------------------------
const paletteEl = document.getElementById("palette");
for (const f of FACE_ORDER) {
  const sw = document.createElement("div");
  sw.className = "swatch" + (f === selected ? " sel" : "");
  sw.style.background = COLOR[f];
  sw.title = f;
  sw.addEventListener("click", () => {
    selected = f;
    [...paletteEl.children].forEach((c, idx) => c.classList.toggle("sel", FACE_ORDER[idx] === f));
  });
  paletteEl.appendChild(sw);
}

// ---- Scanner ---------------------------------------------------------------
const SCAN_STEPS = [
  { L: "F", instr: "Hold <b>any</b> face toward the camera with the cube's top pointing up. This becomes the <b>Front</b>." },
  { L: "R", instr: "Turn the whole cube <b>left</b> so the right-hand face comes to the front. Keep the top up." },
  { L: "B", instr: "Turn <b>left</b> again to show the back face." },
  { L: "L", instr: "Turn <b>left</b> again to show the last side face." },
  { L: "U", instr: "Turn back to the front, then tilt the <b>top</b> face toward the camera (front face now points down)." },
  { L: "D", instr: "Tilt the <b>bottom</b> face toward the camera (front face now points up)." },
];
const facesRGB = {};
let scanStep = 0;
let stream = null;

const video = document.getElementById("video");
const startCamBtn = document.getElementById("startCam");
const captureBtn = document.getElementById("capture");
const rescanBtn = document.getElementById("rescan");
const progressEl = document.getElementById("progress");
const instrEl = document.getElementById("instr");
const vhint = document.getElementById("vhint");
const scanNote = document.getElementById("scanNote");

function renderProgress() {
  progressEl.innerHTML = "";
  SCAN_STEPS.forEach((s, i) => {
    const chip = document.createElement("span");
    chip.className = "chip" + (i < scanStep ? " done" : i === scanStep ? " active" : "");
    chip.textContent = { U: "Up", R: "Right", F: "Front", D: "Down", L: "Left", B: "Back" }[s.L];
    progressEl.appendChild(chip);
  });
}
function updateInstr() {
  if (scanStep < SCAN_STEPS.length) {
    instrEl.innerHTML = `Face ${scanStep + 1} of 6 → <b>${SCAN_STEPS[scanStep].L}</b>. ${SCAN_STEPS[scanStep].instr}`;
    vhint.textContent = "Fill the grid with the face, then press Capture.";
  } else {
    instrEl.innerHTML = "All six faces captured. Check the colours below and fix any mistakes, then press <b>Solve</b>.";
    vhint.textContent = "Scan complete.";
  }
}
renderProgress(); updateInstr();

startCamBtn.addEventListener("click", async () => {
  try {
    stream = await startCamera(video);
    startCamBtn.disabled = true;
    captureBtn.disabled = false;
    rescanBtn.disabled = false;
    vhint.textContent = "Fill the grid with a face, then press Capture.";
  } catch (e) {
    instrEl.innerHTML = "Couldn't open the camera (" + (e.message || e.name) +
      "). You can still build the cube by hand below, or press <b>Random scramble</b> to try the solver.";
  }
});

captureBtn.addEventListener("click", () => {
  const rgb = sampleFace(video);
  if (!rgb) { vhint.textContent = "Camera not ready yet…"; return; }
  facesRGB[SCAN_STEPS[scanStep].L] = rgb;
  scanStep++;
  renderProgress(); updateInstr();
  if (scanStep === SCAN_STEPS.length) {
    captureBtn.disabled = true;
    stopCamera(stream); stream = null;
    startCamBtn.disabled = false; startCamBtn.textContent = "Restart camera";
    const labels = classify(facesRGB);
    for (const f of FACE_ORDER) net[f] = labels[f].slice();
    exitSolution();
    renderNet(net);
    scanNote.textContent = "Scanned. Centres are locked to the colour you scanned for each face.";
    document.getElementById("solveBtn").scrollIntoView({ behavior: "smooth", block: "center" });
  }
});

rescanBtn.addEventListener("click", () => {
  scanStep = 0;
  for (const k of Object.keys(facesRGB)) delete facesRGB[k];
  renderProgress(); updateInstr();
  if (!stream) { startCamBtn.disabled = false; }
  captureBtn.disabled = !stream;
  scanNote.textContent = "";
});

// ---- Solve -----------------------------------------------------------------
const statusEl = document.getElementById("status");
const solPanel = document.getElementById("solPanel");
const movesEl = document.getElementById("moves");
const solMeta = document.getElementById("solMeta");
const playInfo = document.getElementById("playInfo");

function setStatus(msg, kind) { statusEl.textContent = msg; statusEl.className = "status" + (kind ? " " + kind : ""); }

let solMoves = [];
let scrambledState = null;
let playIdx = 0;
let playTimer = null;

document.getElementById("solveBtn").addEventListener("click", () => {
  setStatus("Solving…");
  // yield so the status text paints before the (synchronous) solve runs
  setTimeout(runSolve, 20);
});

function runSolve() {
  const facelets = FACE_ORDER.map((f) => net[f].join("")).join("");
  let state;
  try { state = Cube.fromFacelets(facelets); }
  catch (e) { setStatus("That's not a valid cube: " + e.message + ". Check the colours.", "err"); return; }
  const bad = Cube.validate(state);
  if (bad) { setStatus("Unsolvable cube — " + bad + ". Re-check the stickers.", "err"); return; }

  if (Cube.isSolved(state)) { setStatus("Already solved! 🎉", "ok"); solPanel.style.display = "none"; return; }

  let moves;
  try { moves = solve(state); }
  catch (e) { setStatus("Solver error: " + e.message, "err"); return; }

  setStatus("Solved in " + moves.length + " moves.", "ok");
  solMoves = moves;
  scrambledState = state;
  showSolution();
}

function showSolution() {
  solutionShown = true;
  solPanel.style.display = "";
  solMeta.textContent = `${solMoves.length} moves (beginner layer-by-layer method).`;
  movesEl.innerHTML = "";
  solMoves.forEach((m, i) => {
    const el = document.createElement("span");
    el.className = "mv"; el.textContent = m; el.dataset.i = i;
    el.addEventListener("click", () => seek(i + 1));
    movesEl.appendChild(el);
  });
  seek(0);
  solPanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function seek(idx) {
  stopPlay();
  playIdx = Math.max(0, Math.min(solMoves.length, idx));
  const st = Cube.applySeq(scrambledState, solMoves.slice(0, playIdx));
  const fl = Cube.toFacelets(st);
  const lettersByFace = {};
  FACE_ORDER.forEach((f, k) => { lettersByFace[f] = fl.slice(k * 9, k * 9 + 9).split(""); });
  renderNet(lettersByFace);
  [...movesEl.children].forEach((el, i) => {
    el.classList.toggle("cur", i === playIdx);       // upcoming move
    el.classList.toggle("done", i < playIdx);
  });
  playInfo.textContent = playIdx === solMoves.length
    ? "Done — cube solved."
    : `Move ${playIdx + 1} of ${solMoves.length}: ${solMoves[playIdx]}`;
}

function exitSolution() {
  solutionShown = false;
  stopPlay();
  solPanel.style.display = "none";
  renderNet(net);
}

document.getElementById("next").addEventListener("click", () => seek(playIdx + 1));
document.getElementById("prev").addEventListener("click", () => seek(playIdx - 1));
document.getElementById("toStart").addEventListener("click", () => seek(0));
document.getElementById("toEnd").addEventListener("click", () => seek(solMoves.length));

const playBtn = document.getElementById("play");
function stopPlay() { if (playTimer) { clearInterval(playTimer); playTimer = null; playBtn.textContent = "▶ Play"; } }
playBtn.addEventListener("click", () => {
  if (playTimer) { stopPlay(); return; }
  if (playIdx >= solMoves.length) seek(0);
  playBtn.textContent = "⏸ Pause";
  playTimer = setInterval(() => {
    if (playIdx >= solMoves.length) { stopPlay(); return; }
    seek(playIdx + 1);
  }, 600);
});

// ---- Reset / scramble ------------------------------------------------------
document.getElementById("resetNet").addEventListener("click", () => {
  for (const f of FACE_ORDER) net[f] = Array(9).fill(f);
  exitSolution();
  setStatus("");
});

document.getElementById("scrambleBtn").addEventListener("click", () => {
  const seed = Math.floor(Math.random() * 2 ** 31) || 1;
  const state = Cube.applySeq(Cube.solved(), Cube.scramble(25, seed));
  const fl = Cube.toFacelets(state);
  FACE_ORDER.forEach((f, k) => { net[f] = fl.slice(k * 9, k * 9 + 9).split(""); });
  exitSolution();
  renderNet(net);
  setStatus("Random scramble loaded — press Solve.");
});
