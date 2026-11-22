// Harflardan yasalgan 3D uzuk: halqa pastdan yuqoriga chiziladi,
// keyin tirgaklar ko'tariladi, oxirida olmos uchidan boshlab to'ladi.

const TAU = Math.PI * 2;

const R_BAND = 1.0;
const GIRDLE_R = 0.36;
const GIRDLE_Y = R_BAND + 0.42;
const TABLE_R = 0.21;
const TABLE_Y = GIRDLE_Y + 0.17;
const CULET_Y = GIRDLE_Y - 0.33;

const BAND = 0, PRONG = 1, GEM = 2;

export const DURATION = 20.13; // musiqa uzunligi (s)
const SPIN_START = 4.8;
const TURN = 8; // bir aylanish, sekund
const FLY = 0.7; // zarra uchib kelish vaqti
const CAM_D = 5.2;
const Y_CENTER = 0.3;

const RAMP = '.:-=+*cotuaxzXOAH#%@';

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const norm = (a) => mul(a, 1 / (Math.hypot(a[0], a[1], a[2]) || 1));

function buildScene() {
  const rand = rng(7);
  const P = [], N = [], K = [], A = [];
  const push = (p, n, k, a) => {
    const nn = norm(n);
    P.push(p[0], p[1], p[2]);
    N.push(nn[0], nn[1], nn[2]);
    K.push(k);
    A.push(a);
  };

  // --- halqa (band) ---
  const NT = 420, NP = 30, TA = 0.11, TB = 0.14;
  for (let i = 0; i < NT; i++) {
    const th = (i / NT) * TAU;
    const rx = Math.sin(th), ry = -Math.cos(th);
    const up = Math.min(th, TAU - th) / Math.PI; // 0 pastda, 1 tepada
    for (let j = 0; j < NP; j++) {
      const ph = (j / NP) * TAU;
      const c = Math.cos(ph), s = Math.sin(ph);
      const p = [rx * (R_BAND + TA * c), ry * (R_BAND + TA * c), TB * s];
      const n = [(rx * c) / TA, (ry * c) / TA, s / TB];
      push(p, n, BAND, 0.3 + up * 2.0 + rand() * 0.08);
    }
  }

  // --- tirgaklar (prongs) ---
  for (let i = 0; i < 4; i++) {
    const a = (TAU * (i + 0.5)) / 4;
    const base = [0.08 * Math.cos(a), R_BAND + 0.04, 0.08 * Math.sin(a)];
    const tip = [(GIRDLE_R + 0.015) * Math.cos(a), TABLE_Y - 0.03, (GIRDLE_R + 0.015) * Math.sin(a)];
    const d = norm(sub(tip, base));
    const s = norm(cross(d, [0, 0, 1]));
    const w = cross(s, d);
    for (let u = 0; u <= 40; u++) {
      const uu = u / 40;
      for (let v = 0; v < 10; v++) {
        const phi = (v / 10) * TAU;
        const n = add(mul(s, Math.cos(phi)), mul(w, Math.sin(phi)));
        const p = add(add(base, mul(sub(tip, base), uu)), mul(n, 0.022));
        push(p, n, PRONG, 2.4 + uu * 0.7 + i * 0.08);
      }
    }
  }

  // --- olmos: har bir qirrasi o'zining tekis normaliga ega (shuning uchun yaltiraydi) ---
  const gemAppear = (p) => 3.1 + ((p[1] - CULET_Y) / (TABLE_Y - CULET_Y)) * 1.3;
  const facet = (a, b, c, outward) => {
    let n = norm(cross(sub(b, a), sub(c, a)));
    const centroid = mul(add(add(a, b), c), 1 / 3);
    const ref = outward || sub(centroid, [0, GIRDLE_Y, 0]);
    if (dot(n, ref) < 0) n = mul(n, -1);
    const area = Math.hypot(...cross(sub(b, a), sub(c, a))) / 2;
    const count = Math.max(8, Math.round(area * 16000));
    for (let k = 0; k < count; k++) {
      let u = rand(), v = rand();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const p = add(a, add(mul(sub(b, a), u), mul(sub(c, a), v)));
      push(p, n, GEM, gemAppear(p) + rand() * 0.05);
    }
  };
  const m = 16;
  const girdle = (ang) => [GIRDLE_R * Math.cos(ang), GIRDLE_Y, GIRDLE_R * Math.sin(ang)];
  const table = (ang) => [TABLE_R * Math.cos(ang), TABLE_Y, TABLE_R * Math.sin(ang)];
  const culet = [0, CULET_Y, 0];
  for (let i = 0; i < m; i++) {
    const a0 = (TAU * i) / m, a1 = (TAU * (i + 1)) / m, am = (a0 + a1) / 2;
    const g0 = girdle(a0), g1 = girdle(a1), t0 = table(a0), t1 = table(a1), tm = table(am);
    facet(g0, g1, tm);
    facet(g0, tm, t0);
    facet(g1, t1, tm);
    facet([0, TABLE_Y, 0], t0, t1, [0, 1, 0]);
    facet(g0, girdle(am), culet);
    facet(girdle(am), g1, culet);
  }

  const count = K.length;
  const scatter = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const d = norm([rand() - 0.5, rand() - 0.5, rand() - 0.5]);
    const r = 0.5 + rand() * 1.4;
    scatter[i * 3] = d[0] * r;
    scatter[i * 3 + 1] = d[1] * r + 0.4;
    scatter[i * 3 + 2] = d[2] * r;
  }

  return {
    count,
    P: new Float32Array(P),
    N: new Float32Array(N),
    K: new Uint8Array(K),
    A: new Float32Array(A),
    scatter,
    phase: Float32Array.from({ length: count }, () => rand() * TAU),
  };
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const sc = buildScene();
  const rand = rng(99);

  let W = 0, H = 0, dpr = 1, cellW = 5, cellH = 8, cols = 0, rows = 0, scale = 1;
  let zbuf, bbuf, kbuf, dust = [];

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.max(1, Math.round(rect.width * dpr));
    H = Math.max(1, Math.round(rect.height * dpr));
    canvas.width = W;
    canvas.height = H;
    cellH = Math.max(6, Math.round(Math.min(H, W * 1.35) / 84));
    cellW = Math.max(4, Math.round(cellH * 0.62));
    cols = Math.ceil(W / cellW);
    rows = Math.ceil(H / cellH);
    zbuf = new Float32Array(cols * rows);
    bbuf = new Float32Array(cols * rows);
    kbuf = new Uint8Array(cols * rows);
    scale = Math.min(H / 3.5, W / 3.1) * CAM_D;
    dust = [];
    const nd = Math.round(cols * rows * 0.025);
    for (let i = 0; i < nd; i++) {
      dust.push({ idx: (rand() * cols * rows) | 0, ph: rand() * TAU, sp: 0.5 + rand() * 2 });
    }
  }

  function render(t) {
    const cells = cols * rows;
    zbuf.fill(-1e9);
    bbuf.fill(0);
    kbuf.fill(255);

    const ang = (Math.max(0, t - SPIN_START) * TAU) / TURN;
    const ca = Math.cos(ang), sa = Math.sin(ang);
    const tilt = 0.08, ct = Math.cos(tilt), st = Math.sin(tilt);
    const key = norm([0.0, 0.8, 0.6]);
    const rim = norm([Math.cos(t * 0.9), 0.5, Math.sin(t * 0.9)]);
    const glints = [];
    const { P, N, K, A, scatter, phase } = sc;

    for (let i = 0; i < sc.count; i++) {
      const a = A[i];
      if (t < a - FLY) continue;
      const k = Math.min(1, (t - (a - FLY)) / FLY);
      const e = 1 - (1 - k) ** 3;
      const j = i * 3;
      const fl = 1 - e;
      const x = P[j] + scatter[j] * fl;
      const y = P[j + 1] + scatter[j + 1] * fl;
      const z = P[j + 2] + scatter[j + 2] * fl;
      // Y o'qi atrofida aylanish, keyin ozgina X bo'ylab egilish
      const x1 = ca * x + sa * z;
      const z1 = -sa * x + ca * z;
      const y2 = y * ct - z1 * st;
      const z2 = y * st + z1 * ct;
      const nx0 = N[j], ny0 = N[j + 1], nz0 = N[j + 2];
      const nx = ca * nx0 + sa * nz0;
      const nz1 = -sa * nx0 + ca * nz0;
      const ny = ny0 * ct - nz1 * st;
      const nz = ny0 * st + nz1 * ct;
      if (k >= 1 && nz < -0.15) continue;

      const f = scale / (CAM_D - z2);
      const sx = W / 2 + x1 * f;
      const sy = H / 2 - (y2 - Y_CENTER) * f;
      const cx = (sx / cellW) | 0, cy = (sy / cellH) | 0;
      if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
      const idx = cy * cols + cx;
      if (z2 <= zbuf[idx]) continue;

      const kind = K[i];
      const nk = nx * key[0] + ny * key[1] + nz * key[2];
      const lam = Math.max(0, nk);
      const rv = Math.max(0, nx * rim[0] + ny * rim[1] + nz * rim[2]);
      const rz = 2 * nk * nz - key[2]; // qaytgan nurning kameraga qaragan qismi
      const sp = Math.max(0, rz) ** (kind === GEM ? 28 : 14);
      let b = 0.12 + 0.5 * lam + 0.35 * rv * rv + (kind === GEM ? 1.1 : 0.5) * sp;
      if (kind === GEM) b += 0.12 * Math.sin(t * 6 + phase[i]);
      b *= 0.3 + 0.7 * k;
      if (k < 1) b += 0.25 * Math.max(0, Math.sin(t * 20 + phase[i]));

      zbuf[idx] = z2;
      bbuf[idx] = b;
      kbuf[idx] = kind;
      if (k >= 1 && sp > 0.82 && kind !== PRONG) glints.push([sx, sy, sp, i]);
    }

    // orbitadagi nuqtalar (uzuk qurilgandan keyin paydo bo'ladi)
    const orbitFade = Math.min(1, Math.max(0, (t - 5) / 1.5));
    if (orbitFade > 0) {
      for (let o = 0; o < 2; o++) {
        const rz = o === 0 ? 0.75 : -0.75;
        const cr = Math.cos(rz), sr = Math.sin(rz);
        for (let q = 0; q < 170; q++) {
          if ((q + ((t * 8) | 0)) % 3 === 0) continue;
          const u = (q / 170) * TAU + t * 0.35 * (o ? -1 : 1);
          const ox = 1.75 * Math.cos(u), oz = 0.7 * Math.sin(u);
          const x = ox * cr, y = ox * sr + 0.45;
          const y2 = y * ct - oz * st, z2 = y * st + oz * ct;
          const f = scale / (CAM_D - z2);
          const cx = ((W / 2 + x * f) / cellW) | 0;
          const cy = ((H / 2 - (y2 - Y_CENTER) * f) / cellH) | 0;
          if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) continue;
          const idx = cy * cols + cx;
          if (z2 <= zbuf[idx]) continue;
          zbuf[idx] = z2;
          bbuf[idx] = (0.14 + 0.1 * (0.5 + 0.5 * oz / 0.7)) * orbitFade;
          kbuf[idx] = 3;
        }
      }
    }

    // fon
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, W, H);
    ctx.font = `${cellH}px ui-monospace, Consolas, monospace`;
    ctx.textBaseline = 'top';

    // fondagi chang
    ctx.fillStyle = 'rgba(150,150,150,0.35)';
    for (const d of dust) {
      if (kbuf[d.idx] !== 255) continue;
      const tw = 0.5 + 0.5 * Math.sin(t * d.sp + d.ph);
      if (tw < 0.55) continue;
      ctx.globalAlpha = (tw - 0.55) * 1.6;
      const cx = d.idx % cols, cy = (d.idx / cols) | 0;
      ctx.fillText(tw > 0.9 ? '+' : '.', cx * cellW, cy * cellH);
    }
    ctx.globalAlpha = 1;

    // harflarni yorqinlik bo'yicha guruhlab chizish
    const LV = 16;
    const buckets = Array.from({ length: LV * 4 }, () => []);
    let letters = 0;
    for (let idx = 0; idx < cells; idx++) {
      const kind = kbuf[idx];
      if (kind === 255) continue;
      const b = Math.min(1, bbuf[idx]);
      const lv = Math.min(LV - 1, (b * LV) | 0);
      buckets[kind * LV + lv].push(idx);
      letters++;
    }
    for (let kind = 0; kind < 4; kind++) {
      for (let lv = 0; lv < LV; lv++) {
        const list = buckets[kind * LV + lv];
        if (!list.length) continue;
        const b = (lv + 0.5) / LV;
        const v = Math.round(35 + 220 * b ** 0.85);
        ctx.fillStyle = kind === GEM
          ? `rgb(${v},${v},${Math.min(255, v + 18)})`
          : kind === 3 ? `rgb(${v + 40},${v + 40},${v + 40})` : `rgb(${v},${v},${v})`;
        const base = Math.min(RAMP.length - 1, (b * RAMP.length) | 0);
        for (const idx of list) {
          const cx = idx % cols, cy = (idx / cols) | 0;
          const ch = kind === 3 ? '.' : RAMP[Math.max(0, base - ((cx + cy) & 1))];
          ctx.fillText(ch, cx * cellW, cy * cellH);
        }
      }
    }

    // yaltirashlar (yulduzcha nurlari)
    glints.sort((a, b) => b[2] - a[2]);
    const chosen = [];
    const minD = cellH * 4;
    for (const g of glints) {
      if (chosen.length >= 7) break;
      if (chosen.every((c) => Math.hypot(c[0] - g[0], c[1] - g[1]) > minD)) chosen.push(g);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, sp, i] of chosen) {
      const fl = 0.45 + 0.55 * Math.abs(Math.sin(t * 7 + sc.phase[i] * 3));
      const len = (cellH * (1.5 + 4 * sp)) * fl;
      const glow = ctx.createRadialGradient(x, y, 0, x, y, len * 0.5);
      glow.addColorStop(0, 'rgba(255,255,255,0.85)');
      glow.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, len * 0.5, 0, TAU);
      ctx.fill();
      ctx.lineWidth = Math.max(1, dpr);
      const ray = (dx, dy, l) => {
        const gr = ctx.createLinearGradient(x, y, x + dx * l, y + dy * l);
        gr.addColorStop(0, 'rgba(255,255,255,0.95)');
        gr.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.strokeStyle = gr;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dx * l, y + dy * l);
        ctx.stroke();
      };
      ray(1, 0, len); ray(-1, 0, len); ray(0, 1, len); ray(0, -1, len);
      const dl = len * 0.4;
      ray(0.707, 0.707, dl); ray(-0.707, 0.707, dl); ray(0.707, -0.707, dl); ray(-0.707, -0.707, dl);
    }
    ctx.globalCompositeOperation = 'source-over';

    return {
      rotation: ((ang * 180) / Math.PI) % 360,
      glints: glints.length,
      letters,
    };
  }

  resize();
  return { resize, render };
}
