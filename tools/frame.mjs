#!/usr/bin/env node
/**
 * Renders a generated SVG at exact animation timestamps.
 *
 * Chrome's --virtual-time-budget does not advance SMIL's clock 1:1, so frames
 * captured that way are not the times you asked for. Instead we inline the SVG
 * into a harness page, pauseAnimations() + setCurrentTime(t), and screenshot —
 * which is deterministic.
 *
 *   node tools/frame.mjs 0 1.2 4 8 13 17.2
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SVG = resolve(HERE, "..", process.env.SVG || "assets/commit-run.svg");
const OUTDIR = resolve(HERE, "..", process.env.FRAME_DIR || ".frames");
const CHROME =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const times = process.argv.slice(2).map(Number);
if (!times.length) {
  console.error("usage: node tools/frame.mjs <seconds...>");
  process.exit(1);
}

const svg = readFileSync(SVG, "utf8");
mkdirSync(OUTDIR, { recursive: true });

for (const t of times) {
  const html = `<!doctype html><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:#0d1117}</style>
<div id="host">${svg}</div>
<script>
  var s = document.querySelector("svg");
  s.pauseAnimations();
  s.setCurrentTime(${t});
</script>`;

  const page = join(OUTDIR, `frame-${t}.html`);
  const png = join(OUTDIR, `t${String(t).replace(".", "_")}.png`);
  writeFileSync(page, html);

  execFileSync(
    CHROME,
    [
      "--headless",
      "--disable-gpu",
      "--no-sandbox",
      "--hide-scrollbars",
      "--force-color-profile=srgb",
      "--window-size=880,280",
      `--screenshot=${png}`,
      `file://${page}`,
    ],
    { stdio: "ignore" }
  );
  console.log(`t=${t}s -> ${png}`);
}
