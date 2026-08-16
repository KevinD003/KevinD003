#!/usr/bin/env node
/**
 * Generates assets/commit-run.svg — "COMMIT RUN".
 *
 * The level is not decorative: every column is one real day from the GitHub
 * contribution calendar, and its height is that day's commit count. A pixel
 * runner crosses the terrain, leaping the peaks your commits make and
 * collecting a gem on each active day.
 *
 * The motion is simulated, not hand-tweened. Flat ground is a straight run;
 * a change in height becomes a parabolic hop solved to pass through both
 * column tops with clearance, so the runner can never clip a ledge or miss a
 * landing regardless of what the data does tomorrow.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(HERE, "../data/contributions.json");
const OUT = resolve(HERE, "../assets/commit-run.svg");

// ---------------------------------------------------------------- palette
const C = {
  bg: "#0a0e14",
  deep: "#070a0f",
  cyan: "#00e5ff",
  pink: "#ff2e88",
  yellow: "#ffd400",
  grid: "#132a33",
  rock: "#16323d",
  rockTop: "#1d4757",
  text: "#7fa6b4",
};
/** Column face colour ramps with the day's commit count. */
const TIERS = [
  { min: 1, fill: "#0f5563", top: C.cyan },
  { min: 4, fill: "#0d6b7d", top: C.cyan },
  { min: 8, fill: "#9c1f5a", top: C.pink },
  { min: 15, fill: "#b8880a", top: C.yellow },
];

// ---------------------------------------------------------------- geometry
const VW = 880; // viewport
const VH = 260;
const HUD_H = 42;
const GROUND_Y = 210; // top of the baseline ground
const COL_W = 50;
const GAP_W = 104;        // width of a collapsed quiet stretch
const QUIET_RUN = 3;      // this many zero-days in a row becomes a chasm
const DWELL = 0.22;       // pause on each platform, seconds
const CHASM_CLEAR = 54;   // apex clearance when leaping a chasm
const WINDOW_DAYS = 56; // rolling 8-week level

const RUN_SPEED = 165; // px/s, world units
const GRAVITY = 2100;
const HOP_CLEAR = 26; // px of clearance above the taller of two column tops
const FLAT_HOP = 15; // a small skip even when the ground does not change

const RUNNER_W = 13;
const RUNNER_H = 15;
const PIX = 2.1; // sprite pixel scale
const CAM_LEAD = 330; // runner sits this far from the left edge

const TAIL = 1.6; // seconds held on the finish frame before looping

const PILLAR_CAP = 116; // tallest pillar, leaves headroom under the HUD
/** Heights scale to the busiest day in the window, so the level always
 *  uses the full frame no matter whether the peak is 3 commits or 300. */
const heightFor = (c, max) => (c === 0 ? 0 : 16 + (c / max) * (PILLAR_CAP - 16));
const tierFor = (c) => TIERS.filter((t) => c >= t.min).at(-1) ?? TIERS[0];

// ---------------------------------------------------------------- sprites
// 4-frame run cycle + a jump pose, authored as pixel bitmaps.
const SPRITES = {
  run: [
    [
      "....XXXX.....",
      "...XCCCCX....",
      "...XCWWCX....",
      "...XCCCCX....",
      "....XXXX.....",
      "...XXXXXX....",
      "..XX.XX.XX...",
      ".XX..XX..XX..",
      "XX...XX...XX.",
      ".....XX......",
      "....XXXX.....",
      "...XX..XX....",
      "..XX....XX...",
      ".XX......XX..",
    ],
    [
      "....XXXX.....",
      "...XCCCCX....",
      "...XCWWCX....",
      "...XCCCCX....",
      "....XXXX.....",
      "...XXXXXX....",
      "..XX.XX.XX...",
      "..XX.XX.XX...",
      "...X.XX.X....",
      ".....XX......",
      "....XXXX.....",
      "....XXXX.....",
      "...XX..XX....",
      "..XX....XX...",
    ],
    [
      "....XXXX.....",
      "...XCCCCX....",
      "...XCWWCX....",
      "...XCCCCX....",
      "....XXXX.....",
      "...XXXXXX....",
      "...X.XX.X....",
      "...X.XX.X....",
      ".....XX......",
      ".....XX......",
      "....XXXX.....",
      "....X..X.....",
      "...XX...XX...",
      "..XX......XX.",
    ],
    [
      "....XXXX.....",
      "...XCCCCX....",
      "...XCWWCX....",
      "...XCCCCX....",
      "....XXXX.....",
      "...XXXXXX....",
      "..XX.XX.XX...",
      "..XX.XX.XX...",
      "...X.XX.X....",
      ".....XX......",
      "....XXXX.....",
      "...XX..XX....",
      "...XX..XX....",
      "..XX....XX...",
    ],
  ],
  jump: [
    "....XXXX.....",
    "...XCCCCX....",
    "...XCWWCX....",
    "...XCCCCX....",
    "XX..XXXX..XX.",
    ".XXXXXXXXXX..",
    "..XX.XX.XX...",
    "...X.XX.X....",
    ".....XX......",
    "....XXXX.....",
    "...XX..XX....",
    "..XX....XX...",
    "..X......X...",
    ".XX......XX..",
  ],
};

/** Turn a bitmap into one <path> per colour by merging horizontal pixel runs. */
function spritePaths(rows) {
  const byChar = new Map();
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      const ch = row[x];
      if (ch === ".") {
        x++;
        continue;
      }
      let w = 1;
      while (x + w < row.length && row[x + w] === ch) w++;
      if (!byChar.has(ch)) byChar.set(ch, []);
      byChar.get(ch).push(`M${x} ${y}h${w}v1h-${w}z`);
      x += w;
    }
  });
  const COLORS = { X: C.cyan, C: "#08323d", W: "#ffffff" };
  return [...byChar.entries()].map(([ch, ds]) => ({
    fill: COLORS[ch] ?? C.cyan,
    d: ds.join(""),
  }));
}

// ---------------------------------------------------------------- level
/**
 * Builds the level from real days, collapsing every run of >= QUIET_RUN
 * zero-commit days into a single labelled chasm.
 *
 * Without this a sparse year is ~85% dead-flat ground: technically the data,
 * but unreadable as a level. Collapsing keeps the terrain honest (the gap is
 * shown, and labelled with how many days it swallowed) while turning the quiet
 * stretches into the jumps that give the run its rhythm.
 */
function buildLevel() {
  const data = JSON.parse(readFileSync(DATA, "utf8"));
  const days = data.weeks.flatMap((w) =>
    w.days.map((count, i) => {
      const d = new Date(w.firstDay + "T00:00:00Z");
      d.setUTCDate(d.getUTCDate() + i);
      return { date: d.toISOString().slice(0, 10), count };
    })
  );
  const window = days.slice(-WINDOW_DAYS);

  const segs = [];
  let i = 0;
  while (i < window.length) {
    if (window[i].count === 0) {
      let j = i;
      while (j < window.length && window[j].count === 0) j++;
      const len = j - i;
      if (len >= QUIET_RUN) {
        segs.push({ type: "gap", days: len, date: window[i].date });
      } else {
        for (let k = i; k < j; k++) segs.push({ type: "day", ...window[k] });
      }
      i = j;
    } else {
      segs.push({ type: "day", ...window[i] });
      i++;
    }
  }

  const maxCount = Math.max(1, ...window.map((d) => d.count));
  let x = 0;
  for (const s of segs) {
    s.x = x;
    s.w = s.type === "gap" ? GAP_W : COL_W;
    s.top = s.type === "gap" ? null : GROUND_Y - heightFor(s.count, maxCount);
    s.cx = x + s.w / 2;
    x += s.w;
  }

  return { total: data.total, segs, width: x, days: window, maxCount };
}

// ---------------------------------------------------------------- motion
/**
 * A hop from (x0,y0) to (x1,y1) whose apex clears both ends by HOP_CLEAR.
 * Returns sampled points; the parabola is y = a(x-h)^2 + k in world space.
 */
function hop(x0, y0, x1, y1, samples = 9, clearance = HOP_CLEAR) {
  const dy = y1 - y0;
  // The arc must stay inside the clipped play area, or a leap off a tall pillar
  // sails up behind the HUD and the runner simply disappears mid-jump.
  // The path point is the runner's FEET; the sprite extends RUNNER_H*PIX
  // above it, so the ceiling has to leave room for the whole body.
  const CEILING = HUD_H + RUNNER_H * PIX + 8;
  let apexY = Math.max(CEILING, Math.min(y0, y1) - clearance);
  apexY = Math.min(apexY, Math.min(y0, y1) - 4); // always rise a little

  // y(u) = y0 + dy*u - 4*sag*u*(1-u). Solve for the sag whose minimum sits at
  // apexY — closed form is messy once dy is large, and this is generated once.
  const minY = (sag) => {
    let m = Infinity;
    for (let s = 0; s <= 48; s++) {
      const u = s / 48;
      m = Math.min(m, y0 + dy * u - 4 * sag * u * (1 - u));
    }
    return m;
  };
  let lo = 0;
  let hi = 700;
  for (let it = 0; it < 44; it++) {
    const mid = (lo + hi) / 2;
    if (minY(mid) > apexY) lo = mid;
    else hi = mid;
  }
  const sag = (lo + hi) / 2;

  const pts = [];
  for (let s = 0; s <= samples; s++) {
    const u = s / samples;
    pts.push({
      x: x0 + (x1 - x0) * u,
      y: y0 + dy * u - 4 * sag * u * (1 - u),
    });
  }
  return pts;
}

function simulate(level) {
  // The runner only ever stands on day segments; chasms are crossed in the air.
  const stands = level.segs.filter((s) => s.type === "day");
  const keys = []; // {t, x, y, air}
  const gems = []; // {seg, t}
  const leaps = []; // {seg, t} — chasms, for the dust/streak effects
  let t = 0;
  let score = 0;
  const scoreSteps = [{ t: 0, score: 0 }];

  const collect = (seg) => {
    if (seg.count > 0) {
      score += seg.count;
      gems.push({ seg, t });
      scoreSteps.push({ t, score });
    }
  };

  keys.push({ t, x: stands[0].cx, y: stands[0].top, air: false });
  collect(stands[0]);
  t += DWELL;
  keys.push({ t, x: stands[0].cx, y: stands[0].top, air: false });

  for (let i = 0; i < stands.length - 1; i++) {
    const a = stands[i];
    const b = stands[i + 1];
    // Everything between these two platforms is chasm.
    const between = level.segs.filter(
      (s) => s.type === "gap" && s.x > a.x && s.x < b.x
    );
    const span = b.cx - a.cx;
    const rise = Math.abs(b.top - a.top);

    if (!between.length && a.top === b.top) {
      // Flat adjacent ground: run, with a light skip so it never looks static.
      const dur = span / RUN_SPEED;
      const pts = hop(a.cx, a.top, b.cx, b.top, 4, FLAT_HOP);
      pts.forEach((p, idx) => {
        if (idx === 0) return;
        keys.push({ t: t + dur * (idx / (pts.length - 1)), ...p, air: false });
      });
      t += dur;
    } else {
      // A solved arc: clears both ledges, with airtime scaled to the distance.
      const gapPx = between.reduce((sum, s) => sum + s.w, 0);
      const clear = between.length ? CHASM_CLEAR : HOP_CLEAR;
      const pts = hop(a.cx, a.top, b.cx, b.top, 14, clear);
      const dur =
        (span / RUN_SPEED) * (1 + Math.min(1.0, (rise + gapPx * 0.5) / 140));
      pts.forEach((p, idx) => {
        if (idx === 0) return;
        keys.push({
          t: t + dur * (idx / (pts.length - 1)),
          ...p,
          air: idx < pts.length - 1,
        });
      });
      if (between.length) leaps.push({ seg: between[0], t });
      t += dur;
    }

    collect(b);
    t += DWELL;
    keys.push({ t, x: b.cx, y: b.top, air: false });
  }

  return { keys, gems, leaps, scoreSteps, finishedAt: t, score };
}

// ---------------------------------------------------------------- svg
const n = (v) => Number(v.toFixed(2));
const kt = (v) => Number(v.toFixed(5));

function track(keys, pick, total) {
  const seen = [];
  let prev = -1;
  for (const k of keys) {
    const tt = Math.min(total, k.t);
    if (tt <= prev) continue;
    prev = tt;
    seen.push(k);
  }
  if (seen[0].t > 0) seen.unshift({ ...seen[0], t: 0 });
  if (seen.at(-1).t < total) seen.push({ ...seen.at(-1), t: total });
  return {
    values: seen.map((k) => n(pick(k))).join(";"),
    keyTimes: seen.map((k) => kt(Math.min(1, k.t / total))).join(";"),
  };
}

function build() {
  const level = buildLevel();
  const sim = simulate(level);
  const DUR = sim.finishedAt + TAIL;
  const levelW = level.width;
  const maxCam = Math.max(0, levelW - VW);

  const camKeys = sim.keys.map((k) => ({
    t: k.t,
    v: -Math.max(0, Math.min(maxCam, k.x - CAM_LEAD)),
  }));

  const cam = track(camKeys, (k) => k.v, DUR);
  const rx = track(sim.keys, (k) => k.x - (RUNNER_W * PIX) / 2, DUR);
  const ry = track(sim.keys, (k) => k.y - RUNNER_H * PIX, DUR);

  // calcMode is a parameter, not an appended string: emitting it twice is a
  // duplicate attribute, which is a fatal error when the SVG is served as a
  // standalone file (HTML parsing silently tolerates it, XML does not).
  const anim = (attr, s, mode = "linear") =>
    `<animate attributeName="${attr}" dur="${n(DUR)}s" repeatCount="indefinite" calcMode="${mode}" ` +
    `values="${s.values}" keyTimes="${s.keyTimes}"/>`;

  // --- terrain: day pillars and the chasms that replaced quiet stretches
  const terrain = level.segs
    .map((sg) => {
      if (sg.type === "gap") {
        // A chasm: no floor at all, just lit edges and the day count it ate.
        return (
          `<rect x="${sg.x}" y="${GROUND_Y}" width="${sg.w}" height="${VH - GROUND_Y}" fill="${C.deep}"/>` +
          `<line x1="${sg.x}" y1="${GROUND_Y}" x2="${sg.x}" y2="${VH}" stroke="${C.pink}" stroke-width="2" opacity="0.5"/>` +
          `<line x1="${sg.x + sg.w}" y1="${GROUND_Y}" x2="${sg.x + sg.w}" y2="${VH}" stroke="${C.pink}" stroke-width="2" opacity="0.5"/>` +
          `<text x="${n(sg.cx)}" y="${GROUND_Y + 24}" text-anchor="middle" class="gap">${sg.days} QUIET DAYS</text>`
        );
      }
      if (sg.count === 0) {
        // A lone quiet day, too short to collapse: plain ground to run across.
        return (
          `<rect x="${sg.x}" y="${GROUND_Y}" width="${sg.w}" height="${VH - GROUND_Y}" fill="${C.rock}"/>` +
          `<rect x="${sg.x}" y="${GROUND_Y}" width="${sg.w}" height="2.5" fill="${C.rockTop}"/>` +
          `<text x="${n(sg.cx)}" y="${VH - 8}" text-anchor="middle" class="mon">${sg.date.slice(5)}</text>`
        );
      }
      const tier = tierFor(sg.count);
      return (
        `<rect x="${sg.x}" y="${n(sg.top)}" width="${sg.w}" height="${n(VH - sg.top)}" fill="${tier.fill}" fill-opacity="0.9"/>` +
        `<rect x="${sg.x}" y="${n(sg.top)}" width="${sg.w}" height="3.5" fill="${tier.top}"/>` +
        `<text x="${n(sg.cx)}" y="${n(sg.top + 20)}" text-anchor="middle" class="cnt">${sg.count}</text>` +
        `<text x="${n(sg.cx)}" y="${VH - 8}" text-anchor="middle" class="mon">${sg.date.slice(5)}</text>`
      );
    })
    .join("");

  // --- gems: one per active day, popped as the runner arrives
  const gemEls = sim.gems
    .map(({ seg, t }) => {
      const gt = kt(t / DUR);
      const flash = kt(Math.min(1, (t + 0.22) / DUR));
      const cx = seg.cx;
      const cy = seg.top - 18;
      return (
        `<g><path d="M${n(cx)} ${n(cy - 6)}L${n(cx + 5)} ${n(cy)}L${n(cx)} ${n(cy + 6)}L${n(cx - 5)} ${n(cy)}Z" fill="${C.yellow}" filter="url(#g1)">` +
        `<animate attributeName="opacity" calcMode="discrete" dur="${n(DUR)}s" repeatCount="indefinite" values="1;0" keyTimes="0;${gt}"/>` +
        `<animateTransform attributeName="transform" type="translate" dur="1.5s" repeatCount="indefinite" values="0 0;0 -4;0 0" keyTimes="0;0.5;1"/></path>` +
        `<circle cx="${n(cx)}" cy="${n(cy)}" r="3" fill="none" stroke="${C.yellow}" stroke-width="2" opacity="0">` +
        `<animate attributeName="r" dur="${n(DUR)}s" repeatCount="indefinite" calcMode="linear" values="3;3;20" keyTimes="0;${gt};${flash}"/>` +
        `<animate attributeName="opacity" dur="${n(DUR)}s" repeatCount="indefinite" calcMode="linear" values="0;0.9;0" keyTimes="0;${gt};${flash}"/></circle></g>`
      );
    })
    .join("");

  // --- runner sprite: 4-frame cycle on its own short loop, plus a jump pose
  const frameDur = 0.34;
  const runFrames = SPRITES.run
    .map((rows, idx) => {
      const paths = spritePaths(rows)
        .map((p) => `<path d="${p.d}" fill="${p.fill}"/>`)
        .join("");
      const vals = SPRITES.run.map((_, j) => (j === idx ? 1 : 0)).join(";");
      const times = SPRITES.run.map((_, j) => kt(j / SPRITES.run.length)).join(";");
      return (
        `<g opacity="0">${paths}` +
        `<animate attributeName="opacity" calcMode="discrete" dur="${frameDur}s" ` +
        `repeatCount="indefinite" values="${vals}" keyTimes="${times}"/></g>`
      );
    })
    .join("");
  const jumpPaths = spritePaths(SPRITES.jump)
    .map((p) => `<path d="${p.d}" fill="${p.fill}"/>`)
    .join("");

  // Grounded vs airborne swap, driven by the simulation.
  const airTrack = track(sim.keys, (k) => (k.air ? 1 : 0), DUR);
  const groundTrack = {
    values: airTrack.values
      .split(";")
      .map((v) => (v === "1" ? 0 : 1))
      .join(";"),
    keyTimes: airTrack.keyTimes,
  };

  const scoreEls = sim.scoreSteps
    .map((s, i) => {
      const start = kt(s.t / DUR);
      const end =
        i + 1 < sim.scoreSteps.length ? kt(sim.scoreSteps[i + 1].t / DUR) : 1;
      return (
        `<text x="${VW - 20}" y="28" text-anchor="end" class="score" opacity="0">${String(s.score).padStart(3, "0")}` +
        `<animate attributeName="opacity" calcMode="discrete" dur="${n(DUR)}s" repeatCount="indefinite" ` +
        `values="0;1;0" keyTimes="0;${start};${end}"/></text>`
      );
    })
    .join("");

  const stars = Array.from({ length: 46 }, (_, i) => {
    const sx = (i * 227) % (levelW + VW);
    const sy = HUD_H + 6 + ((i * 97) % (GROUND_Y - HUD_H - 60));
    const r = i % 5 === 0 ? 1.6 : 1;
    return `<circle cx="${sx}" cy="${sy}" r="${r}" fill="${C.cyan}" opacity="${i % 3 === 0 ? 0.32 : 0.16}"/>`;
  }).join("");

  const from = level.days[0].date;
  const to = level.days.at(-1).date;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VW} ${VH}" width="${VW}" height="${VH}" role="img" aria-label="COMMIT RUN — a pixel runner crossing a landscape built from KevinD003's real GitHub contribution history, ${from} to ${to}.">
<defs>
  <filter id="g1" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="g2" x="-60%" y="-60%" width="220%" height="220%">
    <feGaussianBlur stdDeviation="1.7" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#0d1a24"/><stop offset="100%" stop-color="${C.bg}"/>
  </linearGradient>
  <linearGradient id="horizon" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="${C.cyan}" stop-opacity="0"/><stop offset="100%" stop-color="${C.cyan}" stop-opacity="0.10"/>
  </linearGradient>
  <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${C.cyan}"/><stop offset="50%" stop-color="${C.pink}"/><stop offset="100%" stop-color="${C.yellow}"/>
  </linearGradient>
  <clipPath id="view"><rect x="0" y="${HUD_H}" width="${VW}" height="${VH - HUD_H}"/></clipPath>
  <style>
    .hud{font-family:"SFMono-Regular",Consolas,Menlo,monospace;font-size:14px;fill:${C.text};letter-spacing:2px}
    .title{font-family:"SFMono-Regular",Consolas,Menlo,monospace;font-size:17px;font-weight:700;fill:${C.cyan};letter-spacing:5px}
    .score{font-family:"SFMono-Regular",Consolas,Menlo,monospace;font-size:18px;font-weight:700;fill:${C.yellow};letter-spacing:3px}
    .cnt{font-family:"SFMono-Regular",Consolas,Menlo,monospace;font-size:11px;font-weight:700;fill:#04141a}
    .mon{font-family:"SFMono-Regular",Consolas,Menlo,monospace;font-size:9px;fill:${C.text};opacity:.6;letter-spacing:.5px}
    .gap{font-family:"SFMono-Regular",Consolas,Menlo,monospace;font-size:10px;font-weight:700;fill:${C.pink};opacity:.75;letter-spacing:1px}
  </style>
</defs>

<rect width="${VW}" height="${VH}" rx="12" fill="url(#sky)"/>
<rect x="0" y="${GROUND_Y - 46}" width="${VW}" height="46" fill="url(#horizon)"/>

<g clip-path="url(#view)">
  <g>
    <animateTransform attributeName="transform" type="translate" dur="${n(DUR)}s" repeatCount="indefinite"
      calcMode="linear" values="${cam.values
        .split(";")
        .map((v) => `${n(Number(v) * 0.35)} 0`)
        .join(";")}" keyTimes="${cam.keyTimes}"/>
    ${stars}
  </g>

  <g>
    <animateTransform attributeName="transform" type="translate" dur="${n(DUR)}s" repeatCount="indefinite"
      calcMode="linear" values="${cam.values
        .split(";")
        .map((v) => `${v} 0`)
        .join(";")}" keyTimes="${cam.keyTimes}"/>

    ${terrain}
    ${gemEls}

    <g filter="url(#g2)">
      <g>
        <animateTransform attributeName="transform" type="translate" dur="${n(DUR)}s" repeatCount="indefinite"
          calcMode="linear" values="${rx.values
            .split(";")
            .map((v, i) => `${v} ${ry.values.split(";")[i]}`)
            .join(";")}" keyTimes="${rx.keyTimes}"/>
        <g transform="scale(${PIX})">
          <g>${runFrames}${anim("opacity", groundTrack, "discrete")}</g>
          <g opacity="0">${jumpPaths}${anim("opacity", airTrack, "discrete")}</g>
        </g>
      </g>
    </g>
  </g>
</g>

<rect x="1.5" y="1.5" width="${VW - 3}" height="${VH - 3}" rx="11" fill="none" stroke="url(#edge)" stroke-width="2.5" opacity="0.85"/>
<line x1="0" y1="${HUD_H}" x2="${VW}" y2="${HUD_H}" stroke="#1d3540" stroke-width="1.5"/>
<rect x="2" y="2" width="${VW - 4}" height="${HUD_H - 3}" fill="${C.deep}" opacity="0.92"/>
<text x="20" y="28" class="title">COMMIT RUN</text>
<text x="188" y="28" class="hud">// ${from} → ${to} // ${level.total} contributions this year</text>
${scoreEls}
</svg>
`;
}

/**
 * A README banner is fetched as a standalone image and parsed as strict XML.
 * Duplicate attributes and unbalanced tags are fatal there but invisible when
 * the same markup is inlined into an HTML test page, so the generator refuses
 * to emit anything that is not well-formed.
 */
function assertWellFormed(xml) {
  const stack = [];
  const tag = /<(\/?)([a-zA-Z][\w:-]*)((?:\s+[\w:-]+\s*=\s*"[^"]*")*)\s*(\/?)>/g;
  let m;
  while ((m = tag.exec(xml))) {
    const [, closing, name, attrs, selfClose] = m;
    if (!closing) {
      const seen = new Set();
      for (const a of attrs.matchAll(/([\w:-]+)\s*=/g)) {
        if (seen.has(a[1]))
          throw new Error(`duplicate attribute "${a[1]}" on <${name}> at offset ${m.index}`);
        seen.add(a[1]);
      }
    }
    if (closing) {
      const open = stack.pop();
      if (open !== name)
        throw new Error(`closing </${name}> does not match <${open}> at offset ${m.index}`);
    } else if (!selfClose) {
      stack.push(name);
    }
  }
  if (stack.length) throw new Error(`unclosed tag(s): ${stack.join(", ")}`);
  const amps = xml.match(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g);
  if (amps) throw new Error(`${amps.length} unescaped "&"`);
}

const svg = build();
assertWellFormed(svg);
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);

// The playable build on GitHub Pages runs the same level the banner shows.
// Emitted as a JS assignment rather than JSON so it also works from file://.
{
  const lvl = buildLevel();
  const LEVEL_OUT = resolve(HERE, "../docs/level.js");
  mkdirSync(dirname(LEVEL_OUT), { recursive: true });
  writeFileSync(
    LEVEL_OUT,
    "window.LEVEL = " +
      JSON.stringify(
        {
          total: lvl.total,
          maxCount: lvl.maxCount,
          from: lvl.days[0].date,
          to: lvl.days.at(-1).date,
          groundY: GROUND_Y,
          width: lvl.width,
          segs: lvl.segs,
        },
        null,
        1
      ) +
      ";\n"
  );
}

const lvl = buildLevel();
const sim = simulate(lvl);
const pillars = lvl.segs.filter((s) => s.type === "day");
const chasms = lvl.segs.filter((s) => s.type === "gap");
console.log(
  `wrote ${OUT}\n` +
    `  window:     ${lvl.days[0].date} -> ${lvl.days.at(-1).date} (${lvl.days.length} days)\n` +
    `  pillars:    ${pillars.length} (${pillars.map((s) => s.count).join(", ")})\n` +
    `  chasms:     ${chasms.length} (${chasms.map((s) => s.days + "d").join(", ")})\n` +
    `  level:      ${lvl.width}px, camera pan ${Math.max(0, lvl.width - VW)}px\n` +
    `  run:        ${sim.finishedAt.toFixed(2)}s (loop ${(sim.finishedAt + TAIL).toFixed(2)}s), score ${sim.score}\n` +
    `  keyframes:  ${sim.keys.length}\n` +
    `  size:       ${(svg.length / 1024).toFixed(1)} KB`
);
