// scan.js — webcam capture + sticker colour classification.
//
// We sample a 3x3 grid of colours from a centred square of the video frame.
// Colours are classified by nearest-neighbour to the six captured *centre*
// stickers, which auto-calibrates to whatever lighting and cube the user has.

export async function startCamera(video) {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 640 } },
    audio: false,
  });
  video.srcObject = stream;
  await video.play();
  return stream;
}

export function stopCamera(stream) {
  if (stream) for (const t of stream.getTracks()) t.stop();
}

// Sample 9 average RGB colours from the centred ROI of the current video frame.
// Returns [[r,g,b] x9] in reading order (top-left -> bottom-right).
export function sampleFace(video) {
  const w = video.videoWidth, h = video.videoHeight;
  if (!w || !h) return null;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, w, h);

  const side = Math.min(w, h) * 0.6;       // ROI square covering the cube face
  const ox = (w - side) / 2, oy = (h - side) / 2;
  const cell = side / 3;
  const patch = Math.max(4, Math.floor(cell * 0.18));
  const out = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cx = ox + cell * (c + 0.5), cy = oy + cell * (r + 0.5);
      const data = ctx.getImageData(cx - patch, cy - patch, patch * 2, patch * 2).data;
      let R = 0, G = 0, B = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) { R += data[i]; G += data[i + 1]; B += data[i + 2]; n++; }
      out.push([Math.round(R / n), Math.round(G / n), Math.round(B / n)]);
    }
  }
  return out;
}

// Distance that down-weights pure brightness so white vs yellow under warm
// light still separates: compare normalised chroma plus a brightness term.
function colourDist(a, b) {
  const norm = (c) => { const s = c[0] + c[1] + c[2] + 1; return [c[0] / s, c[1] / s, c[2] / s]; };
  const na = norm(a), nb = norm(b);
  const chroma = (na[0] - nb[0]) ** 2 + (na[1] - nb[1]) ** 2 + (na[2] - nb[2]) ** 2;
  const lum = (((a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2])) / 765) ** 2;
  return chroma * 6 + lum;
}

// faces: { U:[9 rgb], R:[9 rgb], ... } -> { U:[9 letters], ... }
// Each sticker is labelled with the face letter whose centre colour is closest.
export function classify(faces) {
  const letters = Object.keys(faces);
  const refs = letters.map((L) => ({ L, rgb: faces[L][4] }));
  const result = {};
  for (const L of letters) {
    result[L] = faces[L].map((rgb) => {
      let best = refs[0].L, bd = Infinity;
      for (const ref of refs) {
        const d = colourDist(rgb, ref.rgb);
        if (d < bd) { bd = d; best = ref.L; }
      }
      return best;
    });
  }
  return result;
}
