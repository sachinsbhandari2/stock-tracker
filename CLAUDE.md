# Stock Tracker — Build 1

## Current version
v4 shipped 9/26/2026. A full visual redesign (approved via a mockup
before any code was touched — see "Lessons" below): Manrope/IBM Plex
Mono fonts, a real user-toggleable dark mode (not just OS preference),
color-coded price moves, and a card-based layout throughout. The chart
now has a 1W/1M toggle that moves the chart and table together
(defaults to 1W). The ticker input has autocomplete (a hardcoded
AI-stack ticker list plus previously-looked-up tickers, zero extra API
calls). A new "Fundamentals" dashboard shows PE ratio, PEG, EPS, market
cap, and 52-week high/low via Alpha Vantage's `OVERVIEW` endpoint,
cached 30 days per ticker in a new `company_overview` table (its own
`checked_on` column — deliberately not named `last_checked`, since
that's already the name of a different table). If fundamentals hit the
shared rate limit, the dashboard shows an honest message instead of
silently disappearing.

v3 (still in place): a lookup checks a `last_checked` table first — if
we've already asked Alpha Vantage about a ticker today (Eastern time),
the app serves the existing snapshot from Supabase instead of calling
Alpha Vantage again, protecting the shared 25-calls/day free-tier limit.
If the daily limit is actually hit, the app shows a clear "Daily lookup
limit reached — try again tomorrow" message, and falls back to whatever
snapshot data already exists for that ticker instead of a bare error.
See handoff.md for what's next.

## Lessons from past sessions
- When adding logic that *updates* existing database rows (not just
  inserts new ones), remember the Supabase `service_role` only has the
  privileges it was explicitly granted. v1's setup only granted `select`
  and `insert`; v2 needed to overwrite existing rows with fresher prices,
  which silently failed until `update` was granted too. Check what
  privileges a new write pattern needs before assuming the existing grants
  cover it.
- When deciding whether cached data is "fresh enough" to skip an external
  API call, don't compare against a calculated ideal (like "today's
  expected trading day," accounting for weekends). v3's first draft did
  this and had a real gap: a trading day's official data doesn't exist
  anywhere — not even from the API itself — until the market closes, so
  the check kept calling the API all day during market hours, defeating
  the point. The simpler and fully correct check for a data source that
  only updates once a day is "did we already ask about this today at
  all," not "do we have the final answer yet."
- For UI/visual redesigns on this project (a portfolio piece — see
  below), build a throwaway static mockup with dummy data first and get
  it approved before writing any real app code. v4's first attempt at
  scoping a redesign tried to describe the look in a paragraph of
  adjectives ("clean," "modern," "professional"); that's not something
  a beginner can meaningfully approve or reject sight-unseen. A quick
  visual mockup made the actual decision fast and concrete, and caught
  real feedback (e.g. "the 1M default view is wrong, should default to
  1W") before it was baked into real code.
- A feature that depends on an external API can fail in ways that look
  like a bug in a specific case but are actually the shared rate limit
  (see "Ground rules" — never invent data if it's missing) resurfacing
  in a new part of the app. v4's fundamentals dashboard originally
  disappeared entirely for some tickers instead of showing why; the fix
  was to always show an explicit message on failure for that section,
  never let a sub-feature fail silently just because the top-level
  price lookup still succeeded.
- When adding a *second* table that also tracks "when did we last check
  this," don't name its column the same as an existing *table*'s name
  (v4 almost named a column in `company_overview` `last_checked`, which
  already exists as the name of a different table — confusing to read
  later). Give it its own distinct name (`checked_on`).

## Who's building this
Sachin is a complete beginner. He has never built or shipped software
before this project. He does not know Git, npm, APIs, databases, or web
frameworks beyond what gets explained to him step by step in this project.

When working with him:
- Don't assume prior knowledge of any tool, command, or concept. Explain
  what a term means the first time it comes up (briefly, in plain English).
- Before running a command that isn't purely read-only (checking a
  version, listing files), explain in one sentence what it does and why,
  even though he'll also see and approve the permission prompt.
- Prefer small, verifiable steps over big multi-file changes, and confirm
  each one worked before moving to the next.
- If something fails, explain what went wrong in plain terms before
  fixing it, not just the fix.
- This is a learning project as much as a shipping project. Don't
  optimize for speed at the cost of him understanding what happened.

## What this app does
A user types a stock ticker (e.g. AAPL) into a search box. The app fetches
that stock's current price from a real data source, saves a snapshot
(ticker, price, date) into a database, and shows the user a price-over-time
chart plus a small table of recent snapshots for that ticker.

As of v2, it still does NOT do: price predictions, news, earnings calls,
fundamentals, or analyst targets. Those are possible later versions, not now.

## Stack
- Framework: Next.js
- Data source: Alpha Vantage (free tier) for daily price history per ticker
- Database: Supabase (free tier, hosted Postgres) — NOT a local file, since
  a local file would not survive on Vercel between visits
- Deploy target: Vercel (free tier)

## Core flow
1. User lands on the page and sees a single input box: "Enter a ticker".
2. User types a ticker and submits.
3. App calls Alpha Vantage for that ticker's price data.
4. App saves a snapshot row (ticker, price, date) to the Supabase database.
   If a snapshot for that ticker + date already exists, don't duplicate it.
5. App displays:
   - A price-over-time line chart for that ticker (using whatever
     snapshot history exists in the database for it so far)
   - A small table of recent snapshots (date, price) for that ticker

## Edge cases (handle explicitly, don't let these crash the app)
- Ticker doesn't exist / API returns no data → show a clear
  "Ticker not found" message.
- Market is closed (weekend/holiday) → show the most recent available
  price, clearly labeled with its actual date, not today's date.
- Same ticker looked up again same day → reuse existing snapshot,
  don't insert a duplicate row.
- API fails or times out → show an honest "Couldn't load data right now,
  try again" message. Never fail silently or show fake/placeholder data.

## Design
Clean, modern, professional look. Not cluttered. One chart, one table,
one input box. Mobile-friendly is a plus but not required for v1.

## Explicitly out of scope for v1 (do not build these yet)
- Future price prediction of any kind
- News, earnings dates, analyst targets, fundamentals
- A fixed watchlist or saved list of tickers per user
- Automatic background daily updates (v1 takes a snapshot when a user
  looks up a ticker, not on a schedule)
- User accounts / login

## Build approach
Build in small, verified steps: get the ticker input and a single API
call working first, verify it returns real data, then add the database
save, then add the chart, then the table. Don't write all pieces at once
and test at the end.

## Ground rules
- Never invent stock data. If the API doesn't return something, say so
  in the UI rather than fabricating a number.
- Keep it small. This is a first build, not a finished product.
