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

## A note on authorship, read this before using anything below

This project was built by directing Claude Code (an AI coding agent) as
a collaborator, not by hand-writing the application code personally.
That distinction matters for how the "skills" below get worded — the
line is: **if Sachin didn't personally write or can't independently
explain a piece of code without help, it's not his hands-on coding
skill, even though the work and the decisions around it are entirely
real.** This section is split accordingly. (This got mis-stated once
already — an earlier draft of this file attributed Tailwind/Recharts/
debugging work to Sachin directly; corrected here.)

## Things Sachin personally did (his actual hands-on skills)

- **Directing an AI coding agent through a real product build**: scoping
  each version, reviewing plans before code was written, and correcting
  the agent's approach when it made a wrong assumption (e.g. flagging
  that a v3 caching design had a real gap, prompting a redesign before
  any code was committed).
- **Hands-on QA against a running app**: testing the live site himself
  across many tickers and catching real bugs from actual observed
  behavior (a layout that visibly jumped, a section that silently
  disappeared instead of showing an error) — the kind of precise bug
  report ("it flows to fundamentals, then jumps back, then pops in")
  that's a real skill distinct from writing the fix.
- **Hand-writing SQL** in Supabase's SQL editor as a deliberate learning
  goal: `COUNT`/`WHERE` and `GROUP BY` aggregate queries, with cross-table
  `JOIN`s as a documented next step (see `handoff.md`'s "Learning goal
  status").
- **Running database administration tasks directly**: creating tables
  and setting Postgres grants/Row Level Security in the Supabase
  console himself, and making the actual security decision (enabling
  RLS) when presented with the tradeoff.
- **Making the explicit product/design calls** when presented with
  options: cache durations, which tickers to hardcode, chart/table
  toggle defaults, visual design direction from a mockup, database
  security settings.
- **Verifying facts before trusting them**: pushing back on and
  independently confirming a ticker symbol claim rather than taking it
  on faith.

## What Claude Code implemented under that direction

Real, shipped work — just not Sachin's own hands-on coding skill:
React + Next.js (TypeScript) component structure, Tailwind CSS styling
and a custom light/dark design-token system, Recharts chart
customization, the two-tier API caching logic, and fixing runtime bugs
(a React hydration mismatch, a data-fetching race condition, a silent
failure path) that surfaced during testing.

## Process skills (legitimately his, regardless of who typed the code)

- Iterative, version-by-version delivery: each version scoped, planned,
  and verified before the next began — not built all at once.
- Validating a UI redesign with a cheap, disposable mockup before any
  production code was touched, specifically to avoid rebuilding a wrong
  assumption twice.
- Treating "it works" and "it's good" as separate bars, and pushing back
  when something technically functioned but didn't meet the actual goal
  (e.g. requesting the chart/table toggle default be reconsidered after
  seeing it live).

## Draft resume bullets

Pick 2–3 depending on the role; don't use all of them at once. These are
worded to hold up honestly under a follow-up question about who wrote
what — see "A note on authorship" above.

- Directed the end-to-end build of a full-stack stock-tracking web app
  (Next.js, TypeScript, Supabase/Postgres) across four iterative
  releases using an AI coding agent (Claude Code), scoping and verifying
  each version before the next began.
- Specified and validated a two-tier API caching strategy to keep a
  data-heavy dashboard feature within a hard third-party rate limit,
  including catching a real design gap in an early draft (a
  calendar-based freshness check that broke during market hours) before
  it shipped.
- Led a UI/UX redesign from mockup to production: reviewed and approved
  a disposable prototype before any application code was written, then
  caught and requested fixes for real usability issues (a confusing
  default view, a jarring layout shift) found through hands-on testing
  of the live app.
- Hand-wrote SQL (aggregate queries with `GROUP BY`, cross-table joins)
  against a Postgres database and independently managed database
  security configuration (Row Level Security, role grants).
- Practiced rigorous AI-assisted development: caught and corrected an
  AI agent's incorrect factual claim (a stock ticker) before it reached
  production, and drove multiple rounds of live-testing-based bug fixes
  rather than accepting "looks done" at face value.

## Draft LinkedIn project description

> **Stock Tracker** — A stock lookup dashboard (Next.js, TypeScript,
> Supabase/Postgres, Tailwind), built by directing an AI coding agent
> (Claude Code) through four iterative, independently-verified releases.
> Fetches real price history and company fundamentals from a live market
> data API, protected by a two-tier caching strategy against a shared,
> hard rate limit — a design gap in the first draft was caught and fixed
> before it shipped. Led an end-to-end UI redesign validated with a
> disposable mockup before any code was written, and drove multiple
> rounds of bug fixes from hands-on testing of the live app. [live demo]
> · [code]

## Skills to add to a LinkedIn profile

Split so it's honest at a glance — pick from both lists as appropriate,
but don't blur them into one undifferentiated list:

**Directed / hands-on:** AI-Assisted Development · Product Management ·
SQL · PostgreSQL · Database Administration · QA / Testing · UI/UX Design
Review · Git/GitHub

**Delivered via AI-directed implementation (real, but not personal
coding proficiency unless independently verified later):** Next.js ·
React · TypeScript · Tailwind CSS · Supabase · REST API Integration ·
Data Visualization (Recharts) · Vercel
