# Stock Tracker — Case Study

A reference document for resume bullets, LinkedIn, and interview talking
points. Written from the actual build history (commits, plans, and
session handoffs) — not embellished, so everything here is something
that can be defended in an interview if asked "walk me through that."

**Live app:** https://stock-tracker-2.vercel.app/
**Code:** https://github.com/sachinsbhandari2/stock-tracker

## What it is, in one sentence

A stock lookup tool that fetches real price history and fundamentals for
any ticker, caches them to stay within a shared free-tier API budget, and
presents them in a designed, portfolio-quality dashboard with light/dark
theming, an interactive chart, and autocomplete.

## Build timeline (v1 → v4)

Each version was scoped, planned, built in small verified steps, and
shipped before starting the next — not built all at once.

**v1 (9/24/2026) — Core lookup.** Ticker input → live price from Alpha Vantage's
`GLOBAL_QUOTE` endpoint → saved to a Supabase (Postgres) table → shown on
a chart. Established the core data flow and honest-error handling (a
missing ticker says so; a failed API call says so; nothing is ever
faked).

**v2 (9/26/2026) — Real history, not one dot a day.** Diagnosed a real product gap:
`GLOBAL_QUOTE` only returns today's price, so the chart only gained one
point per ticker per day, and a first-time visitor saw an empty-looking
chart. Fixed by switching to Alpha Vantage's `TIME_SERIES_DAILY`
endpoint, which backfills ~100 trading days in a single API call — same
cost, dramatically better first-run experience. Required updating the
database write path from insert-only to upsert (and discovering that
Supabase's service-role permissions had to be explicitly widened to
allow it — permissions don't just cover "the obvious next thing").

**v3 (9/26/2026) — Protecting a shared, scarce resource.** The Alpha Vantage free
tier is a hard 25-calls/day budget shared across every visitor to the
live site — one busy afternoon could exhaust it for everyone. Added a
`last_checked` cache table so a ticker already looked up today is served
from the database instead of re-calling the API. Caught and fixed a real
design flaw during planning: an early draft compared against a
calculated "expected trading day" (accounting for weekends), which broke
during market hours because a trading day's official closing price
doesn't exist anywhere — not even from the API — until the market
closes. The simpler, fully-correct check ("did we already ask about this
ticker today at all") replaced it, also eliminating a whole class of
calendar/weekend-edge-case logic that wasn't needed.

**v4 (9/26/2026) — Portfolio-grade redesign, plus a fundamentals dashboard.** The
largest version: a full visual redesign (approved via a disposable design
mockup *before* any production code was written, to validate the design
direction cheaply), a real user-toggleable dark mode (persisted, with no
flash-of-wrong-theme on load), color-coded price movement, a synchronized
1-week/1-month toggle across both the chart and the data table, ticker
autocomplete (mixing a hardcoded list with previously-looked-up tickers,
at zero extra API cost), and a "Fundamentals" section (P/E ratio, PEG,
EPS, market cap, 52-week high/low) via a second Alpha Vantage endpoint
(`OVERVIEW`), cached on its own 30-day schedule distinct from the
daily-price cache, since fundamentals change far more slowly than price.
Also caught and fixed, from live testing rather than planning: a
hydration-mismatch bug from the theme-detection script, a jarring
layout-shift bug from fetching two independent data sources sequentially
instead of in parallel, and a silent-failure bug where the fundamentals
section would vanish entirely (instead of showing an honest message) if
that second API call hit the shared rate limit.

## Skills demonstrated (mapped to where they show up)

**Frontend / product engineering**
- React + Next.js (App Router), TypeScript, component decomposition
- Tailwind CSS, including building a custom design-token system
  (light/dark theming driven by CSS custom properties, not duplicated
  utility classes) rather than relying on defaults
- Recharts (data visualization): custom gradient fills, synchronized
  interactive controls driving both a chart and a table from one state
- Debugging real runtime issues via browser dev tools output (a React
  hydration mismatch, a Next.js font-loading bug) rather than guessing

**Backend / data engineering**
- Designing and consuming REST API integrations against a third-party
  data provider (Alpha Vantage), across two distinct endpoints with
  different data shapes and staleness characteristics
- Postgres schema design (Supabase): multiple related tables, unique
  constraints to prevent duplicate data, upsert patterns
  (insert-or-update) instead of naive inserts
- Hand-writing SQL: `COUNT`/`WHERE`, `GROUP BY` aggregates, and
  cross-table `JOIN`s
- Designing and implementing a two-tier caching strategy against a hard
  external rate limit (a same-day cache for fast-changing data, a 30-day
  cache for slow-changing data), including graceful, honest degradation
  when the limit is actually hit (never a silent failure or fabricated
  data)
- Understanding and configuring database-level permissions (Postgres
  grants) as a distinct concern from application code

**Process / product judgment**
- Iterative, version-by-version delivery: each version scoped, planned,
  built in small verified steps, and shipped before starting the next
- Validating a UI redesign with a cheap, disposable mockup before writing
  production code, to avoid rebuilding a wrong assumption twice
- Root-causing bugs from real observed behavior (a live screenshot, a
  console error) rather than guessing from theory
- Working with an AI pair-programming workflow (Claude Code / Cursor) as
  a directed collaborator — reviewing its output, catching incorrect
  assumptions it made, and correcting its plan before code was written

## Draft resume bullets

Pick 2–3 depending on the role; don't use all of them at once.

- Designed and shipped a full-stack stock-tracking web app (Next.js,
  TypeScript, Supabase/Postgres) across four iterative releases, each
  independently planned, built, and verified before the next began.
- Built a two-tier API caching strategy to keep a data-heavy dashboard
  feature within a hard third-party rate limit, including graceful
  fallback behavior instead of silent failures when the limit is hit.
- Diagnosed and fixed a data-freshness bug where a calendar-based caching
  rule broke during market hours, replacing it with a simpler, fully
  correct check — reducing unnecessary logic while fixing the bug.
- Led a UI/UX redesign from mockup to production: validated a new visual
  design with a disposable prototype before writing any application
  code, then implemented a token-based light/dark theming system in
  Tailwind CSS.
- Wrote and executed hand-crafted SQL (aggregate queries, multi-table
  joins) against a Postgres database to support caching and reporting
  features.

## Draft LinkedIn project description

> **Stock Tracker** — A stock lookup dashboard (Next.js, TypeScript,
> Supabase/Postgres, Tailwind) built and shipped in four iterative
> versions. Fetches real price history and company fundamentals from a
> live market data API, with a two-tier caching layer that keeps the app
> within a shared, hard rate limit — a design caught and corrected
> mid-build after finding a real gap in the first draft's logic.
> Redesigned end-to-end with a mockup-first process, a real
> light/dark theming system, and an interactive, portfolio-quality
> dashboard UI. [live demo] · [code]

## Skills to add to a LinkedIn profile

Next.js · React · TypeScript · Tailwind CSS · Supabase · PostgreSQL ·
SQL · REST API Integration · Data Visualization (Recharts) · Caching
Strategies · Git/GitHub · Vercel · AI-Assisted Development
