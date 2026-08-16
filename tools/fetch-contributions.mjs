#!/usr/bin/env node
/**
 * Pulls the real contribution calendar for a GitHub user and writes
 * data/contributions.json — the terrain source for the runner level.
 *
 *   GITHUB_TOKEN=... node tools/fetch-contributions.mjs KevinD003
 *
 * Falls back to the `gh` CLI's token when GITHUB_TOKEN is unset, so it works
 * both locally and inside Actions.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, "../data/contributions.json");
const USER = process.argv[2] || "KevinD003";

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync("gh", ["auth", "token"], { encoding: "utf8" }).trim();
  } catch {
    throw new Error("no GITHUB_TOKEN and `gh auth token` failed");
  }
}

const QUERY = `
query($login: String!) {
  user(login: $login) {
    contributionsCollection {
      contributionCalendar {
        totalContributions
        weeks {
          firstDay
          contributionDays { date contributionCount weekday }
        }
      }
    }
  }
}`;

const res = await fetch("https://api.github.com/graphql", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
    "User-Agent": "kevind003-profile-generator",
  },
  body: JSON.stringify({ query: QUERY, variables: { login: USER } }),
});

if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
const json = await res.json();
if (json.errors) throw new Error(JSON.stringify(json.errors));

const cal = json.data.user.contributionsCollection.contributionCalendar;

// Collapse each week to the shape the level generator needs.
const weeks = cal.weeks.map((w) => {
  const counts = w.contributionDays.map((d) => d.contributionCount);
  return {
    firstDay: w.firstDay,
    total: counts.reduce((a, b) => a + b, 0),
    peak: Math.max(...counts),
    days: counts,
  };
});

const payload = {
  user: USER,
  total: cal.totalContributions,
  generatedFor: weeks.at(-1)?.firstDay ?? null,
  weeks,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(payload, null, 2));

const active = weeks.filter((w) => w.total > 0).length;
console.log(
  `${USER}: ${cal.totalContributions} contributions across ${weeks.length} weeks ` +
    `(${active} active, peak week ${Math.max(...weeks.map((w) => w.total))})`
);
