<div align="center">

<img src="assets/cover.svg" width="100%" alt="Kevin Davra — FY2026 Annual Report. Finance brain, builder's hands. 7 products across 7 industries. Dallas, TX. Open to roles." />

<br>

<a href="https://github.com/KevinD003/KevinD003/issues/new?template=recruiter-inquiry.yml"><img src="https://img.shields.io/badge/Recruiters-Start%20a%20conversation-e3b448?style=for-the-badge&labelColor=0b1324" alt="Recruiters: start a conversation" /></a>
<a href="https://thedesievents.com"><img src="https://img.shields.io/badge/Live%20product-thedesievents.com-5ee6a8?style=for-the-badge&labelColor=0b1324" alt="Live product: thedesievents.com" /></a>
<a href="https://kevind003.github.io/KevinD003/"><img src="https://img.shields.io/badge/Play-COMMIT%20RUN-5cc8ff?style=for-the-badge&labelColor=0b1324" alt="Play COMMIT RUN" /></a>

</div>

<br>

## 01 · Letter to Shareholders

> I came up through **finance** — reconciliations, forecasts, month-end close, the
> spreadsheet that runs the business. In 2026 I started shipping software with an
> **AI-native workflow** (Claude Code as the pair, me as the PM, architect and auditor).
>
> The result is a portfolio of **seven products in seven industries** — one live
> marketplace, a multi-tenant CRM, a personal-finance ledger, an ML fare-forecasting
> engine — each with tests, decision logs and an honest limitations ledger.
>
> **The edge:** I understand the P&L *and* the pull request. I know which number the
> CFO will ask about, and I can build the system that produces it.
>
> — *Kevin Davra, Dallas, TX*

<br>

## 02 · Key Metrics

<img src="assets/kpis.svg" width="100%" alt="Key metrics: 7 products, 900K+ lines of code, 1,095 test files, 7 industries, 0 made-up numbers." />

<sub>Measured from source across all product repos (Oct 2026). "0 made-up numbers" is a house rule: every repo documents what is proven, what is mocked and what is blocked.</sub>

<br>

## 03 · Portfolio — Business Units

<img src="assets/portfolio.svg" width="100%" alt="Portfolio by business unit, ranked by lines of code: The Desi Events 552K, Vacamodiq 152K, LeadFlow 71K, Tally 67K, NoEfforts 32K, Kailo.fit 21K, STITCHIQ 8.5K." />

| Ticker | Business unit | The problem → what I built | Stack | Status |
|:--|:--|:--|:--|:--|
| **`$DESI`** | **[The Desi Events](https://thedesievents.com)** | South Asian events live on WhatsApp forwards and Google Forms → a real ticketing marketplace: discovery, checkout, per-event booking fees, referral codes, door payments kept outside the ledger. 3 apps on 13 shared packages, ADR-driven. | Fastify · Next.js · BullMQ · PostgreSQL · Redis · Prisma | 🟢 **Live** · [code](https://github.com/KevinD003/projectX) |
| **`$LEAD`** | **LeadFlow** | Sales teams juggle five tools to find and work a lead → a multichannel lead-gen CRM. Multi-tenant (DB-per-company), 226 API endpoints, 27-route dashboard, 17-category security audit. | Python · React 19 · TypeScript · Vite · SQLite → Supabase | 🟢 Private beta |
| **`$TALY`** | **Tally** | Your money lives in four bank CSVs → one honest ledger. Auto-import (Amex, Chase, Wells Fargo), ML categorization that learns, budgets, month-end close checklist, 24-month cash-flow forecast, Splitwise sync. | FastAPI · React · TypeScript · scikit-learn · Claude | 🔵 v1 · local-first |
| **`$VACA`** | **Vacamodiq** | "Should I book this flight now or wait?" → fare monitoring + forecasting + booking-decision engine. Booking saga, payments ledger, fraud/underwriting, circuit breakers, cross-language conformance vectors. | Python · LightGBM · Next.js · Postgres · Docker | 🟣 R&D · synthetic data |
| **`$KAIL`** | **Kailo.fit** | Runners' data is trapped in watch apps → AI training companion: 3D route flythroughs, Riegel race predictions, AI-generated periodised plans, live GPS tracking, and an **MCP server** so you can ask Claude about your training. | Next.js · Supabase · Mapbox · Recharts · Claude API | 🔵 Beta |
| **`$NOEF`** | **NoEfforts** | Job hunting is copy-paste at scale → one reviewed profile, collected jobs, prepared answers — **nothing sent without human approval**, unknown facts never guessed. | FastAPI · Celery · Next.js · Playwright · Postgres | 🟣 Phase A · [code](https://github.com/KevinD003/AutoApply) |
| **`$STIQ`** | **STITCHIQ** | Embroidery digitizing is slow, manual, expensive software → browser studio: image → stitches via computer vision, 45+ machine formats, 3D thread preview, production-package export. 110 tests green. | FastAPI · OpenCV · React · Konva · Three.js | 🔵 Beta |

<sub>🔒 Most repositories are private — code walkthroughs and live demos available on request.</sub>

<br>

## 04 · Operating Model — how I ship

```text
 PROBLEM          SPEC              BUILD                 PROVE                 DISCLOSE
 ───────          ────              ─────                 ─────                 ────────
 A finance-   →   ADRs + a     →    AI-paired dev     →   unit · e2e ·      →   STATUS · LIMITATIONS
 shaped pain      decision log      (Claude Code)         security tests        · DECISION_LOG in
                                    small, reviewed PRs   CI gates every PR     every single repo
```

- **Controls first.** Payments default to mock and *refuse to boot* with live keys. Auto-apply never submits without approval. Every query in LeadFlow is scoped by tenant. I design like an auditor will read it — because one will.
- **Numbers you can trace.** Tally's rule: a figure is computed from stored data by a documented formula, or it shows a dash and a reason. Never a zero standing in for "unknown".
- **AI as leverage, not autopilot.** I own the product decisions, the architecture and the review. The model writes a lot of code; I decide what ships.

<br>

## 05 · Capabilities

<table>
<tr><td><b>Finance &amp; Business</b></td><td>
<img src="https://img.shields.io/badge/FP%26A-0b1324?style=flat-square" alt="FP&A" />
<img src="https://img.shields.io/badge/Forecasting-0b1324?style=flat-square" alt="Forecasting" />
<img src="https://img.shields.io/badge/Month--end%20close-0b1324?style=flat-square" alt="Month-end close" />
<img src="https://img.shields.io/badge/Reconciliation-0b1324?style=flat-square" alt="Reconciliation" />
<img src="https://img.shields.io/badge/Pricing%20strategy-0b1324?style=flat-square" alt="Pricing strategy" />
<img src="https://img.shields.io/badge/Ledgers%20%26%20payments-0b1324?style=flat-square" alt="Ledgers and payments" />
</td></tr>
<tr><td><b>AI</b></td><td>
<img src="https://img.shields.io/badge/Claude%20API-D97757?style=flat-square&logo=anthropic&logoColor=white" alt="Claude API" />
<img src="https://img.shields.io/badge/Claude%20Code-D97757?style=flat-square&logo=anthropic&logoColor=white" alt="Claude Code" />
<img src="https://img.shields.io/badge/MCP%20servers-0b1324?style=flat-square" alt="MCP servers" />
<img src="https://img.shields.io/badge/LightGBM-0b1324?style=flat-square" alt="LightGBM" />
<img src="https://img.shields.io/badge/scikit--learn-F7931E?style=flat-square&logo=scikitlearn&logoColor=white" alt="scikit-learn" />
<img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=flat-square&logo=opencv&logoColor=white" alt="OpenCV" />
</td></tr>
<tr><td><b>Languages</b></td><td>
<img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python" />
<img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="JavaScript" />
<img src="https://img.shields.io/badge/SQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="SQL" />
</td></tr>
<tr><td><b>Product stack</b></td><td>
<img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js" />
<img src="https://img.shields.io/badge/React-149ECA?style=flat-square&logo=react&logoColor=white" alt="React" />
<img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
<img src="https://img.shields.io/badge/Fastify-000000?style=flat-square&logo=fastify&logoColor=white" alt="Fastify" />
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
<img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
<img src="https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</td></tr>
<tr><td><b>Ship &amp; operate</b></td><td>
<img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
<img src="https://img.shields.io/badge/GitHub%20Actions-2088FF?style=flat-square&logo=githubactions&logoColor=white" alt="GitHub Actions" />
<img src="https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white" alt="Playwright" />
<img src="https://img.shields.io/badge/Pytest-0A9EDC?style=flat-square&logo=pytest&logoColor=white" alt="Pytest" />
<img src="https://img.shields.io/badge/Cloudflare-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare" />
</td></tr>
</table>

<br>

## 06 · Shipping Cadence — live

<img src="https://raw.githubusercontent.com/KevinD003/KevinD003/main/assets/commit-run.svg?v=202610211800" width="100%" alt="COMMIT RUN — a pixel runner crossing a level built from my real GitHub contribution history; pillar height is that day's commit count." />

<sub>Not a stock widget. Every pillar is one real day of my commit history, regenerated every morning by a GitHub Action I wrote. Quiet stretches become labelled chasms. <a href="https://kevind003.github.io/KevinD003/">Take the controls →</a></sub>

<details>
<summary><b>How COMMIT RUN works</b> (for the engineers in the room)</summary>

<br>

1. **Real data.** A scheduled Action pulls my contribution calendar from the GitHub GraphQL API into `data/contributions.json`.
2. **Generated, not drawn.** `tools/gen-runner.mjs` turns each active day into a pillar scaled to the busiest day; runs of 3+ zero days collapse into one labelled gap.
3. **Simulated motion.** Every height change is a parabolic arc solved by binary search so the runner clears both ledges and never clips the HUD.
4. **Zero JavaScript.** The solved path is baked into SMIL `<animate>` keyframes, because GitHub strips scripts from READMEs. ~48 KB, runs anywhere an `<img>` does.

```
tools/fetch-contributions.mjs   GraphQL  ->  data/contributions.json
tools/gen-runner.mjs            data     ->  assets/commit-run.svg  +  docs/level.js
.github/workflows/commit-run.yml          ->  re-runs both, every morning
```

</details>

<br>

## 07 · Risk Factors &amp; Forward-Looking Statements

- **Risk:** Candidate may automate your team's manual reporting within the first 90 days.
- **Risk:** Candidate will ask "where does this number come from?" — and then build the lineage.
- **Guidance FY2027:** Moving into a full-time role at the intersection of **finance and AI** — finance transformation, FP&amp;A automation, AI solutions / product, or fintech engineering.

<br>

## 08 · Investor Relations

<div align="center">

**Hiring for finance × AI, fintech, or a builder who speaks CFO?**

<a href="https://github.com/KevinD003/KevinD003/issues/new?template=recruiter-inquiry.yml"><img src="https://img.shields.io/badge/Open%20a%20recruiter%20inquiry-e3b448?style=for-the-badge&logo=github&logoColor=0b1324" alt="Open a recruiter inquiry" /></a>
<a href="https://github.com/KevinD003"><img src="https://img.shields.io/badge/Follow%20on%20GitHub-0b1324?style=for-the-badge&logo=github&logoColor=white" alt="Follow on GitHub" /></a>

<sub>📍 Dallas, Texas · open to on-site, hybrid and remote</sub>

<br><br>

<sub><code>$DESI</code> · <code>$LEAD</code> · <code>$TALY</code> · <code>$VACA</code> · <code>$KAIL</code> · <code>$NOEF</code> · <code>$STIQ</code> — this is not investment advice, but it is a good hire.</sub>

</div>
