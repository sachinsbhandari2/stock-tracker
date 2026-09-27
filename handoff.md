# Handoff: Stock Tracker

Last updated 9/26/2026. Read this first, then v2-plan.md (kept for history —
its plan is now built).

## Current state: v3, shipped 9/26/2026
- Live: https://stock-tracker-2.vercel.app/ (v3 changes verified locally;
  not yet deployed — deploy + live check still pending)
- Code: https://github.com/sachinsbhandari2/stock-tracker
- What it does: type a ticker, the app first checks a `last_checked` table
  (new in v3) — if we've already asked Alpha Vantage about this ticker
  today (Eastern time), it serves the existing snapshot from Supabase
  instead of calling Alpha Vantage again. Otherwise it gets the last ~100
  trading days from Alpha Vantage (TIME_SERIES_DAILY, compact) in one call,
  saves every day to Supabase (existing days get refreshed with the newest
  price instead of duplicated), stamps `last_checked`, and shows a chart of
  the full stored history plus a table of the 10 most recent days. If Alpha
  Vantage's daily limit is hit, shows a clear "Daily lookup limit reached —
  try again tomorrow" message, falling back to any existing cached data for
  that ticker instead of a bare error.
- Built with: Next.js, Supabase (Postgres), Alpha Vantage, Recharts, Vercel,
  directed through Cursor + Claude Code.
- Required a one-time Supabase setup: a new `last_checked` table (ticker,
  checked_on) with `select`/`insert`/`update` granted to `service_role` —
  same kind of one-time grant step as v2's fix, new table needs its own
  grants (see CLAUDE.md's "Lessons from past sessions").
- Design correction made mid-session: the first draft compared the
  database's latest date against a calculated "expected trading day"
  (accounting for weekends). That had a real gap during market hours —
  today's official close doesn't exist until after market close, so the
  check kept calling Alpha Vantage all day. Fixed by tracking a simpler
  fact instead: "did we already ask about this ticker today at all,"
  which also removed the need for any weekend/holiday calendar logic.

## What's broken or rough
- v3 verified working locally only — still needs to be deployed to Vercel
  and checked live, same as v2's rollout process.

## Next step: v4 — UI polish + stats + single-stock dashboard + autocomplete
  + chart week/month toggle
Bundled together because they're all frontend/presentation-layer work (see
roadmap below for the breakdown of each piece). Not scoped in detail yet —
do that at the start of the v4 session.

## Roadmap after v3 (one version can bundle several features when they're
the same area of the codebase — kept as separate work when they're not)
- v4 — UI polish + stats + single-stock dashboard + ticker autocomplete +
  chart week/month toggle. All frontend/presentation-layer work:
  - Visual redesign: color-coded price moves (green/red), better layout,
    spacing, visual hierarchy — make it read as a real stock app instead
    of a bare form.
  - More stats: PE ratio, PEG ratio, EPS, market cap, 52-week high/low,
    % change — laid out as a proper single-stock dashboard rather than
    bolted onto the current card/table. PE/PEG/EPS/market cap need Alpha
    Vantage's `OVERVIEW` endpoint (a second, separate API call per ticker
    from the price history call), and change slowly — cache much longer
    than daily prices, not on every lookup.
  - Ticker autocomplete: type a couple letters, see suggestions. Source: a
    small hardcoded list of common tickers (zero API cost) plus "recently
    looked-up" tickers already in the `snapshots` table (also zero extra
    cost) — not Alpha Vantage's `SYMBOL_SEARCH`, which would burn quota on
    every keystroke.
  - Chart week/month toggle: pure frontend filtering of data already
    fetched (~100 days currently stored covers both), no backend change.
- v4.1 — year toggle for the chart, as its own quick follow-up right after
  v4, since it's the one piece touching data-fetching logic instead of
  pure display: switch the Alpha Vantage call from `outputsize=compact` to
  `outputsize=full` (same 1 API call, more data in the response — no extra
  quota cost) and confirm Supabase handles the larger per-ticker row count
  fine (still trivial for free-tier Postgres).
- v5 — First AI feature, a "Why did it move?" button. Input: a ticker plus
  the date range already on the chart. Output: 3-4 sentences on what
  likely drove the biggest move in that range, with a source link for
  every claim. Depends on v2's real history to find a "biggest move." Not
  scoped yet. Sachin is currently leaning against building this given it's
  the one feature with real per-use cost — kept on the roadmap for a
  future revisit, not committed. Settle these in its Problem/Logic/Plan
  steps if revisited:
  - Cost: the Claude API is billed separately from the Claude Pro plan, pay per
    use. First part of this build that costs real money (small, not zero).
  - Honesty: news lines up with a move but rarely proves it caused it. Output
    says "likely," cites a source for every claim, and never states a cause as
    fact. No predictions, no advice. CLAUDE.md's "never invent data" still rules.
  - News source: not decided. If it's Alpha Vantage's news endpoint, it shares
    the 25 calls/day.
  - Pipeline or agent? If the steps are fixed (get the move, get the news, one
    AI call to summarize), it's a simple AI pipeline, not an agent, and that's
    probably right. It only becomes an agent if the AI has to decide what to
    look up next (e.g. search again when the news doesn't match the move).
    Start simple; add that only if simple gives bad results. Describe it as
    what it is, not as an "agent" unless it actually is one.
  - How do we check the AI's answers are right? (This is "evals.")
- Not scoped, blocked on real constraints — multi-stock dashboard/watchlist
  (S&P 500 or "popular tickers" overview, filterable/sortable by market cap
  or % change). Two concrete blockers, not just size: (1) fetching many
  tickers would blow past the 25 calls/day free Alpha Vantage quota almost
  immediately — S&P 500 scale needs a paid tier; (2) it needs scheduled
  background refreshes, which this app deliberately doesn't do (snapshots
  are taken on lookup only). Revisit only if/when ready to change those two
  foundational choices.
- Later, order set by user feedback: compare two tickers, mobile layout.

## Learning goal status
- SQL: done, 9/26/2026. First hand-written queries in Supabase's SQL editor:
  a `COUNT` with `WHERE` (rows for one ticker), and a `GROUP BY` with
  `COUNT`/`MIN`/`MAX` (rows + date range per ticker). Ahead of the 11/25
  target.
- Stretch query after v2: for one ticker, find the single biggest day-to-day
  price change in the stored history. Harder (compares each day to the one
  before it), and it's the exact input the v5 "why did it move" explainer
  needs.
- JOIN practice: now possible — v3 added a second table (`last_checked`).
  A simple first JOIN: list every ticker with its latest snapshot price
  alongside its `last_checked` date, to see both tables' info in one query.

## Every push
- Confirm no .env file or API key is being committed (.gitignore covers
  .env*, but check anyway). Keys stay in environment variables.

## Still owed
- Story step: short case study. Write it after v2 ("v1 had an empty chart,
  here's how I found it and fixed it").
