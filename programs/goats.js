(() => {
  // ── DOM refs ──
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const inputPanel = document.getElementById("input-panel");
  const playerLabel = document.getElementById("player-label");
  const angleInput = document.getElementById("angle-input");
  const velocityInput = document.getElementById("velocity-input");
  const fireBtn = document.getElementById("fire-btn");

  const W = 640, H = 480;
  const GRAVITY = 200;
  const SMALL_EXPLOSION_R = 25;
  const BIG_EXPLOSION_R = 40;
  const GOAT_W = 40, GOAT_H = 36;
  const ROUNDS_TO_WIN = 3;

  // ── Offscreen terrain canvas ──
  const terrainCanvas = document.createElement("canvas");
  terrainCanvas.width = W;
  terrainCanvas.height = H;
  const tCtx = terrainCanvas.getContext("2d");

  // ── Audio context (lazy init) ──
  let audioCtx = null;
  function ensureAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  function playThrow() {
    ensureAudio();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(300, audioCtx.currentTime);
    o.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.15);
    g.gain.setValueAtTime(0.15, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    o.connect(g).connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + 0.2);
  }

  function playExplosion(big) {
    ensureAudio();
    const dur = big ? 0.5 : 0.3;
    const buf = audioCtx.createBuffer(1, audioCtx.sampleRate * dur, audioCtx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) * 0.4;
    }
    const src = audioCtx.createBufferSource();
    src.buffer = buf;
    src.connect(audioCtx.destination);
    src.start();
  }

  function playVictory() {
    ensureAudio();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = "square";
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.12, audioCtx.currentTime + i * 0.15);
      g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.15 + 0.3);
      o.connect(g).connect(audioCtx.destination);
      o.start(audioCtx.currentTime + i * 0.15);
      o.stop(audioCtx.currentTime + i * 0.15 + 0.3);
    });
  }

  // Preload real goat bleat into Web Audio API buffer (CC0 from BigSoundBank)
  let bleatBuffer = null;
  (function preloadBleat() {
    const url = new Audio().canPlayType("audio/ogg") ? "goat-bleat.ogg" : "goat-bleat.mp3";
    fetch(url)
      .then(r => r.arrayBuffer())
      .then(buf => {
        ensureAudio();
        return audioCtx.decodeAudioData(buf);
      })
      .then(decoded => { bleatBuffer = decoded; })
      .catch(() => {});
  })();

  function playBleat() {
    if (!bleatBuffer) return;
    ensureAudio();
    const src = audioCtx.createBufferSource();
    src.buffer = bleatBuffer;
    src.connect(audioCtx.destination);
    src.start();
  }

  // ── Game State ──
  const state = {
    phase: "title",        // title | aiming | firing | explosion | victory | gameover
    currentPlayer: 0,      // 0 or 1
    scores: [0, 0],
    wind: 0,
    buildings: [],
    goats: [null, null],   // {x, y} center-bottom of goat
    projectile: null,      // {x, y, vx, vy, angle (visual rotation)}
    explosion: null,       // {x, y, r, maxR, growing}
    hitPlayer: -1,
    sunShocked: false,
    victoryTimer: 0,
    titleTime: 0,
  };

  // ── Building / City Generation ──
  function generateCity() {
    const buildings = [];
    let x = 0;
    while (x < W) {
      const bw = 30 + Math.random() * 40 | 0;
      const bh = 80 + Math.random() * (H * 0.55) | 0;
      const color = `hsl(${Math.random() * 30 + 10}, ${30 + Math.random() * 20}%, ${20 + Math.random() * 15}%)`;
      const windows = [];
      const winW = 6, winH = 8, padX = 8, padY = 10;
      for (let wy = H - bh + padY; wy < H - padY; wy += winH + padY) {
        for (let wx = x + padX; wx < x + bw - padX; wx += winW + padX) {
          windows.push({ x: wx, y: wy, lit: Math.random() > 0.35 });
        }
      }
      buildings.push({ x, y: H - bh, w: bw, h: bh, color, windows });
      x += bw;
    }
    return buildings;
  }

  function drawBuildingsToTerrain() {
    tCtx.clearRect(0, 0, W, H);
    for (const b of state.buildings) {
      tCtx.fillStyle = b.color;
      tCtx.fillRect(b.x, b.y, b.w, b.h);
      for (const win of b.windows) {
        tCtx.fillStyle = win.lit ? "#ffdd44" : "#111";
        tCtx.fillRect(win.x, win.y, 6, 8);
      }
    }
  }

  function placeGoats() {
    const bs = state.buildings;
    // Player 1: on a building in left 20%
    const left = bs.filter(b => b.x + b.w / 2 < W * 0.2);
    const b1 = left[left.length - 1] || bs[1];
    // Player 2: on a building in right 20%
    const right = bs.filter(b => b.x + b.w / 2 > W * 0.8);
    const b2 = right[0] || bs[bs.length - 2];

    state.goats[0] = { x: b1.x + b1.w / 2, y: b1.y };
    state.goats[1] = { x: b2.x + b2.w / 2, y: b2.y };
  }

  // ── Drawing helpers ──

  // Goat pixel art (20x18 grid, each cell drawn at 2px)
  // 0=transparent, 1=body(white), 2=head/legs(gray), 3=horns(tan), 4=eye(black), 5=hooves(dark)
  const goatSprite = [
    [0,0,0,0,0,0,0,0,3,3,0,0,3,3,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,3,0,0,3,3,0,0,3,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,2,2,2,2,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,2,2,4,2,2,4,2,2,0,0,0,0,0],
    [0,0,0,0,0,0,0,2,2,2,2,2,2,2,2,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,2,2,1,1,2,2,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,1,1,1,1,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,0,0,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0],
    [0,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
    [0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,2,2,0,0,0,0,0,0,2,2,0,0,0,0],
    [0,0,0,0,0,0,2,2,0,0,0,0,0,0,2,2,0,0,0,0],
    [0,0,0,0,0,0,5,5,0,0,0,0,0,0,5,5,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,1,1,1,0,0,0,0,0,0],
  ];

  const spriteColors = { 1: "#eee", 2: "#aaa", 3: "#c8a84e", 4: "#000", 5: "#555" };

  function drawGoat(gx, gy, facingRight, dancing, frame) {
    ctx.save();
    const scale = 2;
    const ox = gx - (goatSprite[0].length * scale) / 2;
    const oy = gy - goatSprite.length * scale;

    if (!facingRight) {
      ctx.translate(gx, 0);
      ctx.scale(-1, 1);
      ctx.translate(-gx, 0);
    }

    if (dancing) {
      const bounce = Math.sin(frame * 0.3) * 4;
      ctx.translate(0, bounce);
    }

    for (let r = 0; r < goatSprite.length; r++) {
      for (let c = 0; c < goatSprite[r].length; c++) {
        const v = goatSprite[r][c];
        if (v === 0) continue;
        ctx.fillStyle = spriteColors[v];
        ctx.fillRect(ox + c * scale, oy + r * scale, scale, scale);
      }
    }
    ctx.restore();
  }

  // ── Sun ──
  function drawSun() {
    const sx = W / 2, sy = 45, r = 28;
    // Rays
    ctx.strokeStyle = "#ffdd00";
    ctx.lineWidth = 2;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * (r + 4), sy + Math.sin(a) * (r + 4));
      ctx.lineTo(sx + Math.cos(a) * (r + 14), sy + Math.sin(a) * (r + 14));
      ctx.stroke();
    }
    // Face
    ctx.fillStyle = "#ffee44";
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(sx - 9, sy - 5, state.sunShocked ? 4 : 3, 0, Math.PI * 2);
    ctx.arc(sx + 9, sy - 5, state.sunShocked ? 4 : 3, 0, Math.PI * 2);
    ctx.fill();
    // Mouth
    if (state.sunShocked) {
      ctx.beginPath();
      ctx.arc(sx, sy + 10, 7, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(sx, sy + 4, 10, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }

  // ── Wind Arrow ──
  function drawWind() {
    const bx = W / 2, by = H - 18;
    const len = state.wind * 1.5;
    ctx.strokeStyle = "#0ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + len, by);
    ctx.stroke();
    if (Math.abs(len) > 2) {
      const dir = len > 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(bx + len, by);
      ctx.lineTo(bx + len + dir * 6, by - 4);
      ctx.moveTo(bx + len, by);
      ctx.lineTo(bx + len + dir * 6, by + 4);
      ctx.stroke();
    }
    ctx.fillStyle = "#0ff";
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("WIND", bx, by + 14);
  }

  // ── Tin Can Projectile ──
  function drawTinCan(x, y, rotation, player) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    // Can body
    ctx.fillStyle = "#aaa";
    ctx.fillRect(-5, -8, 10, 16);
    // Label stripe
    ctx.fillStyle = player === 0 ? "#e44" : "#44e";
    ctx.fillRect(-5, -3, 10, 6);
    // Top/bottom rims
    ctx.fillStyle = "#ccc";
    ctx.fillRect(-6, -8, 12, 2);
    ctx.fillRect(-6, 6, 12, 2);
    ctx.restore();
  }

  // ── Explosion ──
  function drawExplosion() {
    if (!state.explosion) return;
    const e = state.explosion;
    const grad = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r);
    grad.addColorStop(0, "rgba(255,255,200,0.9)");
    grad.addColorStop(0.4, "rgba(255,160,0,0.7)");
    grad.addColorStop(1, "rgba(255,60,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ── Scoreboard ──
  function drawScoreboard() {
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(0, 0, W, 22);
    ctx.font = "14px monospace";
    ctx.fillStyle = "#e44";
    ctx.textAlign = "left";
    ctx.fillText(`P1: ${state.scores[0]}`, 10, 16);
    ctx.fillStyle = "#44e";
    ctx.textAlign = "right";
    ctx.fillText(`P2: ${state.scores[1]}`, W - 10, 16);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.fillText(`First to ${ROUNDS_TO_WIN}`, W / 2, 16);
  }

  // ── Title Screen ──
  function drawTitle(time) {
    ctx.fillStyle = "#001";
    ctx.fillRect(0, 0, W, H);

    // Sparkle border
    const colors = ["#f00", "#ff0", "#0f0", "#0ff", "#f0f", "#00f"];
    const spacing = 8;
    const t = time * 0.06;
    for (let i = 0; i < (W * 2 + H * 2) / spacing; i++) {
      const ci = (i + (t | 0)) % colors.length;
      let px, py;
      const pos = i * spacing;
      if (pos < W) { px = pos; py = 0; }
      else if (pos < W + H) { px = W - 1; py = pos - W; }
      else if (pos < W * 2 + H) { px = W - (pos - W - H); py = H - 1; }
      else { px = 0; py = H - (pos - W * 2 - H); }
      ctx.fillStyle = colors[ci];
      ctx.fillRect(px, py, 4, 4);
    }

    // Title text
    ctx.fillStyle = "#fff";
    ctx.font = "bold 72px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("G O A T S", W / 2, H / 3);

    ctx.font = "16px monospace";
    ctx.fillStyle = "#aaa";
    ctx.fillText("A tribute to GORILLA.BAS (1990)", W / 2, H / 3 + 50);
    ctx.fillText("Gorillas \u2192 Goats  \u00B7  Bananas \u2192 Tin Cans", W / 2, H / 3 + 75);

    // Start button
    const btnW = 200, btnH = 50;
    const bx = W / 2 - btnW / 2, by = H * 0.62;
    ctx.fillStyle = "#333";
    ctx.fillRect(bx, by, btnW, btnH);
    ctx.strokeStyle = "#0f0";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, btnW, btnH);
    ctx.fillStyle = "#0f0";
    ctx.font = "bold 22px monospace";
    ctx.fillText("START GAME", W / 2, by + btnH / 2 + 2);

    // Store button bounds for click detection
    state._startBtn = { x: bx, y: by, w: btnW, h: btnH };
  }

  // ── Victory / Game Over screens ──
  function drawVictoryOverlay() {
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "bold 36px monospace";
    ctx.fillStyle = "#ff0";
    ctx.textAlign = "center";
    const winner = state.hitPlayer === 1 ? "Player 1" : "Player 2";
    ctx.fillText(`${winner} scores!`, W / 2, H / 2 - 20);
    ctx.font = "18px monospace";
    ctx.fillStyle = "#ccc";
    ctx.fillText("Click to continue...", W / 2, H / 2 + 30);
  }

  function drawGameOver() {
    ctx.fillStyle = "#001";
    ctx.fillRect(0, 0, W, H);
    ctx.font = "bold 48px monospace";
    ctx.fillStyle = "#ff0";
    ctx.textAlign = "center";
    const winner = state.scores[0] >= ROUNDS_TO_WIN ? "Player 1" : "Player 2";
    ctx.fillText(`${winner} WINS!`, W / 2, H / 3);
    ctx.font = "24px monospace";
    ctx.fillStyle = "#fff";
    ctx.fillText(`${state.scores[0]}  -  ${state.scores[1]}`, W / 2, H / 3 + 50);
    ctx.font = "16px monospace";
    ctx.fillStyle = "#aaa";
    ctx.fillText("Click to play again", W / 2, H * 0.65);
  }

  // ── Terrain collision ──
  function terrainHit(x, y) {
    if (x < 0 || x >= W || y < 0 || y >= H) return false;
    const pixel = tCtx.getImageData(x | 0, y | 0, 1, 1).data;
    return pixel[3] > 128;
  }

  function punchTerrain(cx, cy, r) {
    tCtx.save();
    tCtx.globalCompositeOperation = "destination-out";
    tCtx.beginPath();
    tCtx.arc(cx, cy, r, 0, Math.PI * 2);
    tCtx.fill();
    tCtx.restore();
  }

  function goatHit(x, y, playerIdx) {
    const g = state.goats[playerIdx];
    if (!g) return false;
    return x > g.x - GOAT_W / 2 && x < g.x + GOAT_W / 2 &&
           y > g.y - GOAT_H && y < g.y;
  }

  // ── State transitions ──
  function startNewRound() {
    state.buildings = generateCity();
    drawBuildingsToTerrain();
    placeGoats();
    state.wind = (Math.random() - 0.5) * 50;
    state.projectile = null;
    state.explosion = null;
    state.sunShocked = false;
    state.hitPlayer = -1;
    state.currentPlayer = Math.random() < 0.5 ? 0 : 1;
    enterAiming();
  }

  function enterAiming() {
    state.phase = "aiming";
    inputPanel.style.display = "flex";
    playerLabel.textContent = `Player ${state.currentPlayer + 1}`;
    playerLabel.style.color = state.currentPlayer === 0 ? "#e44" : "#44e";
    angleInput.value = "45";
    velocityInput.value = "60";
    angleInput.focus();
  }

  function fire() {
    const angle = parseFloat(angleInput.value) || 45;
    const velocity = (parseFloat(velocityInput.value) || 60) * 2;
    const rad = angle * Math.PI / 180;
    const g = state.goats[state.currentPlayer];
    const dir = state.currentPlayer === 0 ? 1 : -1;

    state.projectile = {
      x: g.x + dir * (GOAT_W / 2 + 5),
      y: g.y - GOAT_H / 2,
      vx: dir * velocity * Math.cos(rad),
      vy: -velocity * Math.sin(rad),
      rot: 0,
    };

    state.phase = "firing";
    inputPanel.style.display = "none";
    playThrow();
  }

  function startExplosion(x, y, maxR, hitPlayerIdx) {
    state.explosion = { x, y, r: 2, maxR, growing: true };
    state.hitPlayer = hitPlayerIdx;
    state.phase = "explosion";
    punchTerrain(x, y, maxR);
    playExplosion(maxR > SMALL_EXPLOSION_R);
    if (hitPlayerIdx >= 0) playBleat();
  }

  function switchTurns() {
    state.currentPlayer = 1 - state.currentPlayer;
    state.sunShocked = false;
    state.projectile = null;
    enterAiming();
  }

  // ── Input handling ──
  fireBtn.addEventListener("click", () => {
    if (state.phase === "aiming") fire();
  });

  function handleInputKey(e) {
    if (e.key === "Enter" && state.phase === "aiming") {
      e.preventDefault();
      fire();
    }
  }
  angleInput.addEventListener("keydown", handleInputKey);
  velocityInput.addEventListener("keydown", handleInputKey);

  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (W / rect.width);
    const my = (e.clientY - rect.top) * (H / rect.height);

    if (state.phase === "title") {
      const b = state._startBtn;
      if (b && mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
        state.scores = [0, 0];
        startNewRound();
      }
    } else if (state.phase === "victory") {
      if (state.scores[0] >= ROUNDS_TO_WIN || state.scores[1] >= ROUNDS_TO_WIN) {
        state.phase = "gameover";
      } else {
        startNewRound();
      }
    } else if (state.phase === "gameover") {
      state.phase = "title";
    }
  });

  // ── Main Update ──
  let lastTime = 0;
  let frameCount = 0;

  function update(dt) {
    if (state.phase === "firing" && state.projectile) {
      const p = state.projectile;
      p.vx += state.wind * dt;
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += 5 * dt;

      // Sun shocked?
      const dSun = Math.hypot(p.x - W / 2, p.y - 45);
      state.sunShocked = dSun < 60;

      // Off screen?
      if (p.x < -20 || p.x > W + 20 || p.y > H + 20) {
        state.sunShocked = false;
        switchTurns();
        return;
      }

      // Hit opponent goat?
      const opponent = 1 - state.currentPlayer;
      if (goatHit(p.x, p.y, opponent)) {
        startExplosion(p.x, p.y, BIG_EXPLOSION_R, opponent);
        return;
      }

      // Hit self? (unlikely but possible with wind)
      if (goatHit(p.x, p.y, state.currentPlayer)) {
        startExplosion(p.x, p.y, BIG_EXPLOSION_R, state.currentPlayer);
        return;
      }

      // Hit terrain?
      if (p.y > 0 && terrainHit(p.x, p.y)) {
        startExplosion(p.x, p.y, SMALL_EXPLOSION_R, -1);
        return;
      }
    }

    if (state.phase === "explosion" && state.explosion) {
      const e = state.explosion;
      if (e.growing) {
        e.r += 150 * dt;
        if (e.r >= e.maxR) {
          e.r = e.maxR;
          e.growing = false;
        }
      } else {
        e.r -= 100 * dt;
        if (e.r <= 0) {
          state.explosion = null;
          state.projectile = null;
          if (state.hitPlayer >= 0) {
            // Someone was hit
            const scorer = 1 - state.hitPlayer;
            state.scores[scorer]++;
            state.phase = "victory";
            state.victoryTimer = 0;
            playVictory();
          } else {
            switchTurns();
          }
        }
      }
    }

    if (state.phase === "victory") {
      state.victoryTimer++;
    }
  }

  // ── Main Draw ──
  function draw() {
    ctx.clearRect(0, 0, W, H);

    if (state.phase === "title") {
      state.titleTime++;
      drawTitle(state.titleTime);
      return;
    }

    if (state.phase === "gameover") {
      drawGameOver();
      return;
    }

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#000033");
    sky.addColorStop(1, "#000066");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Sun
    drawSun();

    // Terrain (buildings)
    ctx.drawImage(terrainCanvas, 0, 0);

    // Goats
    for (let i = 0; i < 2; i++) {
      const g = state.goats[i];
      if (!g) continue;
      const dancing = state.phase === "victory" && state.hitPlayer !== i;
      drawGoat(g.x, g.y, i === 0, dancing, frameCount);
    }

    // Projectile
    if (state.projectile && state.phase === "firing") {
      drawTinCan(state.projectile.x, state.projectile.y, state.projectile.rot, state.currentPlayer);
    }

    // Explosion
    drawExplosion();

    // Wind
    drawWind();

    // Scoreboard
    drawScoreboard();

    // Victory overlay
    if (state.phase === "victory") {
      drawVictoryOverlay();
    }
  }

  // ── Game Loop ──
  function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    frameCount++;

    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // Start on title screen
  state.phase = "title";
  requestAnimationFrame((ts) => {
    lastTime = ts;
    loop(ts);
  });
})();
