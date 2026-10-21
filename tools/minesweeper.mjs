#!/usr/bin/env node
/**
 * Community Minesweeper for the profile README.
 *
 * Every visitor plays the same board. A hidden tile in the README is a link that
 * opens a pre-filled issue titled `mines|reveal|C4`; the workflow passes that
 * title here, we apply the move, rewrite game/state.json and the README block
 * between the MINES markers, and the workflow closes the issue.
 *
 *   node tools/minesweeper.mjs move "<issue title>" <github-login>
 *   node tools/minesweeper.mjs new
 *   node tools/minesweeper.mjs render
 *   node tools/minesweeper.mjs tiles      # regenerate game/tiles/*.svg
 *
 * The first reveal of a game is always safe: mines are laid only after it,
 * away from the clicked tile and its neighbours.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomInt } from "node:crypto";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const STATE = resolve(ROOT, "game/state.json");
const README = resolve(ROOT, "README.md");
const TILES = resolve(ROOT, "game/tiles");

const REPO = "KevinD003/KevinD003";
const SIZE = 8;
const MINES = 10;
const COLS = "ABCDEFGH";
const TILE_URL = `https://raw.githubusercontent.com/${REPO}/main/game/tiles`;
const START = "<!-- MINES:START -->";
const END = "<!-- MINES:END -->";

// ---------------------------------------------------------------- state

function freshGame(prev) {
  return {
    game: (prev?.game ?? 0) + 1,
    status: "playing", // playing | won | lost
    mines: [], // laid on the first reveal
    revealed: [],
    moves: 0,
    lastMoves: [],
    players: {}, // login -> safe tiles revealed in this game
    stats: prev?.stats ?? { won: 0, lost: 0 },
    hallOfFame: prev?.hallOfFame ?? {}, // login -> safe tiles revealed, all time
    lostBy: null,
  };
}

const load = () =>
  existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : freshGame();
const save = (s) => writeFileSync(STATE, JSON.stringify(s, null, 2) + "\n");

const idx = (r, c) => r * SIZE + c;
const label = (i) => `${COLS[i % SIZE]}${Math.floor(i / SIZE) + 1}`;

function neighbours(i) {
  const r = Math.floor(i / SIZE), c = i % SIZE, out = [];
  for (let dr = -1; dr <= 1; dr++)
    for (let dc = -1; dc <= 1; dc++) {
      const rr = r + dr, cc = c + dc;
      if ((dr || dc) && rr >= 0 && rr < SIZE && cc >= 0 && cc < SIZE) out.push(idx(rr, cc));
    }
  return out;
}

const countAround = (s, i) => neighbours(i).filter((n) => s.mines.includes(n)).length;

function layMines(s, safe) {
  const banned = new Set([safe, ...neighbours(safe)]);
  const pool = [...Array(SIZE * SIZE).keys()].filter((i) => !banned.has(i));
  while (s.mines.length < MINES) s.mines.push(pool.splice(randomInt(pool.length), 1)[0]);
}

// ---------------------------------------------------------------- moves

/** Returns a one-line result for the issue comment. Throws on an invalid move. */
function move(s, title, login) {
  const m = /^mines\|(reveal\|([A-H])([1-8])|new)$/i.exec(title.trim());
  if (!m) throw new Error("That issue title isn't a Minesweeper move.");
  if (!/^[A-Za-z0-9-]{1,39}$/.test(login)) throw new Error("Unexpected player name.");

  if (m[1].toLowerCase() === "new") {
    if (s.status === "playing") throw new Error("A game is still in progress — finish it first!");
    Object.assign(s, freshGame(s));
    return `Game #${s.game} started. Good luck!`;
  }

  if (s.status !== "playing") throw new Error("This game is over — start a new one from the profile.");
  const i = idx(Number(m[3]) - 1, COLS.indexOf(m[2].toUpperCase()));
  if (s.revealed.includes(i)) throw new Error(`${label(i)} is already open.`);

  if (!s.mines.length) layMines(s, i);
  s.moves++;
  let result;

  if (s.mines.includes(i)) {
    s.status = "lost";
    s.lostBy = { login, cell: i };
    s.stats.lost++;
    result = `💥 ${label(i)} was a mine. Game #${s.game} is over.`;
  } else {
    // Flood-fill outward from zero tiles.
    const before = s.revealed.length, stack = [i];
    while (stack.length) {
      const j = stack.pop();
      if (s.revealed.includes(j)) continue;
      s.revealed.push(j);
      if (countAround(s, j) === 0)
        for (const n of neighbours(j)) if (!s.revealed.includes(n) && !s.mines.includes(n)) stack.push(n);
    }
    const gained = s.revealed.length - before;
    s.players[login] = (s.players[login] ?? 0) + gained;
    s.hallOfFame[login] = (s.hallOfFame[login] ?? 0) + gained;
    result = `✅ ${label(i)} was safe — ${gained} tile${gained === 1 ? "" : "s"} cleared.`;
    if (s.revealed.length === SIZE * SIZE - MINES) {
      s.status = "won";
      s.stats.won++;
      result += ` 🏆 Board cleared — Game #${s.game} won!`;
    }
  }

  s.lastMoves.unshift({ login, cell: label(i), boom: s.status === "lost" });
  s.lastMoves = s.lastMoves.slice(0, 5);
  return result;
}

// ---------------------------------------------------------------- render

function issueLink(title, body) {
  return `https://github.com/${REPO}/issues/new?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
}

const MOVE_BODY =
  "Just click **Create** below — no need to change anything.\n\n" +
  "A GitHub Action will play your move, update the board on the profile and close this issue in about a minute.";

function tile(s, i) {
  const img = (name, alt) => `<img src="${TILE_URL}/${name}.svg" width="36" height="36" alt="${alt}">`;
  const over = s.status !== "playing";
  if (s.revealed.includes(i)) return img(String(countAround(s, i)), String(countAround(s, i)));
  if (over && s.mines.includes(i)) return s.lostBy?.cell === i ? img("boom", "exploded mine") : img("mine", "mine");
  if (over) return img("hidden", "hidden");
  return `<a href="${issueLink(`mines|reveal|${label(i)}`, MOVE_BODY)}">${img("hidden", label(i))}</a>`;
}

function render(s) {
  const safeTotal = SIZE * SIZE - MINES;
  const rows = [];
  rows.push(`<tr><td></td>${[...COLS].map((c) => `<td align="center"><sub><b>${c}</b></sub></td>`).join("")}</tr>`);
  for (let r = 0; r < SIZE; r++)
    rows.push(
      `<tr><td align="center"><sub><b>${r + 1}</b></sub></td>` +
        [...Array(SIZE).keys()].map((c) => `<td>${tile(s, idx(r, c))}</td>`).join("") +
        `</tr>`
    );

  const status = {
    playing: `**Game #${s.game}** · 💣 ${MINES} mines · 🟩 ${s.revealed.length}/${safeTotal} cleared · ${s.moves} moves`,
    won: `🏆 **Game #${s.game} won!** The community cleared all ${safeTotal} safe tiles in ${s.moves} moves.`,
    lost: `💥 **Game #${s.game} lost** — @${s.lostBy?.login} hit the mine at ${s.lostBy && label(s.lostBy.cell)}.`,
  }[s.status];

  const fame = Object.entries(s.hallOfFame).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const recent = s.lastMoves.map((m) => `${m.boom ? "💥" : "✅"} @${m.login} → \`${m.cell}\``).join(" · ");

  return [
    START,
    `<div align="center">`,
    ``,
    status,
    ``,
    `<table>${rows.join("")}</table>`,
    ``,
    s.status === "playing"
      ? `<sub>Click any dark tile, then press <b>Create</b> on the issue that opens. The board updates in about a minute.</sub>`
      : `<a href="${issueLink("mines|new", MOVE_BODY)}"><b>▶ Start game #${s.game + 1}</b></a>`,
    ``,
    recent ? `<sub>Recent: ${recent}</sub>` : `<sub>No moves yet — the first click is always safe.</sub>`,
    ``,
    `<sub>All-time: 🏆 ${s.stats.won} won · 💥 ${s.stats.lost} lost${
      fame.length ? ` · Top sweepers: ${fame.map(([l, n]) => `@${l} (${n})`).join(", ")}` : ""
    }</sub>`,
    ``,
    `</div>`,
    END,
  ].join("\n");
}

function writeReadme(s) {
  const md = readFileSync(README, "utf8");
  const a = md.indexOf(START), b = md.indexOf(END);
  if (a < 0 || b < 0) throw new Error("README is missing the MINES markers.");
  writeFileSync(README, md.slice(0, a) + render(s) + md.slice(b + END.length));
}

// ---------------------------------------------------------------- tiles

function tiles() {
  mkdirSync(TILES, { recursive: true });
  const wrap = (inner) =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36" width="36" height="36">${inner}</svg>\n`;
  const font = `font-family="-apple-system,'Segoe UI',Helvetica,Arial,sans-serif" font-weight="800"`;
  const open = `<rect x="1" y="1" width="34" height="34" rx="7" fill="#161b22" stroke="#30363d"/>`;
  const colours = ["", "#58a6ff", "#3fb950", "#f85149", "#bc8cff", "#d29922", "#39c5cf", "#f0f6fc", "#8b949e"];

  writeFileSync(
    `${TILES}/hidden.svg`,
    wrap(
      `<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4452"/><stop offset="1" stop-color="#242b35"/></linearGradient></defs>` +
        `<rect x="1" y="1" width="34" height="34" rx="7" fill="url(#g)" stroke="#4b5563"/>` +
        `<rect x="4" y="3" width="28" height="2" rx="1" fill="#ffffff" fill-opacity="0.12"/>`
    )
  );
  for (let n = 0; n <= 8; n++)
    writeFileSync(
      `${TILES}/${n}.svg`,
      wrap(open + (n ? `<text x="18" y="25" text-anchor="middle" font-size="19" ${font} fill="${colours[n]}">${n}</text>` : ""))
    );
  const bomb =
    `<g stroke="#f0f6fc" stroke-width="2" stroke-linecap="round"><path d="M18 8v20M8 18h20M11 11l14 14M25 11 11 25"/></g>` +
    `<circle cx="18" cy="18" r="7" fill="#0d1117" stroke="#f0f6fc" stroke-width="1.5"/><circle cx="15.5" cy="15.5" r="1.8" fill="#f0f6fc"/>`;
  writeFileSync(`${TILES}/mine.svg`, wrap(open + bomb));
  writeFileSync(`${TILES}/boom.svg`, wrap(`<rect x="1" y="1" width="34" height="34" rx="7" fill="#da3633" stroke="#f85149"/>` + bomb));
}

// ---------------------------------------------------------------- main

const [cmd, ...args] = process.argv.slice(2);
if (cmd === "tiles") tiles();
else if (cmd === "render") writeReadme(load());
else if (cmd === "new") { const s = freshGame(existsSync(STATE) ? load() : undefined); save(s); writeReadme(s); }
else if (cmd === "move") {
  const s = load();
  try {
    const msg = move(s, args[0] ?? "", args[1] ?? "");
    save(s);
    writeReadme(s);
    console.log(msg);
  } catch (e) {
    console.log(`🤔 ${e.message}`);
    process.exitCode = 2; // invalid move: comment and close, nothing to commit
  }
} else {
  console.error("usage: minesweeper.mjs move <title> <login> | new | render | tiles");
  process.exit(1);
}
