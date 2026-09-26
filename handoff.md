# Handoff: Stock Tracker

Last updated 9/26/2026. Read this first, then v2-plan.md (kept for history —
its plan is now built).

## Current state: v2, shipped 9/26/2026
- Live: https://stock-tracker-2.vercel.app/
- Code: https://github.com/sachinsbhandari2/stock-tracker
- What it does: type a ticker, the app gets the last ~100 trading days from
  Alpha Vantage (TIME_SERIES_DAILY, compact) in one call, saves every day to
  Supabase (existing days get refreshed with the newest price instead of
  duplicated), and shows a chart of the full stored history plus a table of
  the 10 most recent days.
- Built with: Next.js, Supabase (Postgres), Alpha Vantage, Recharts, Vercel,
  directed through Cursor + Claude Code.
- Required a one-time Supabase permission fix: `service_role` only had
  `select`/`insert` from v1's setup; v2's "refresh existing days" logic needed
  `update` granted too (see CLAUDE.md's "Lessons from past sessions").

## What's broken or rough
- **Every lookup calls Alpha Vantage**, even when the database already has
  today's data. Free key = 25 calls per day, shared by the live site and
  local testing. This is the v3 fix.
- **Rate-limit message** is generic ("try again") even though the limit is
  daily. Also v3.

## Next step: v3 — stop wasting API calls
If the database already has the latest trading day for a ticker, serve it
from the database and skip Alpha Vantage. Plus a clearer "daily limit
reached, try again tomorrow" message. Not scoped in detail yet — do that at
the start of the v3 session. This is what makes it safe to share the link
widely, since right now every visitor's lookup shares the same 25 calls/day.

## Roadmap after v2 (one feature per version)
- v3: Stop wasting API calls. If the database already has the latest trading
  day, serve it from the database and skip Alpha Vantage. Plus a clearer
  "daily limit reached" message. Needed before sharing the link widely.
- v4: First AI feature, a "Why did it move?" button. Input: a ticker plus the
  date range already on the chart. Output: 3-4 sentences on what likely drove
  the biggest move in that range, with a source link for every claim. Depends
  on v2 (needs real history to find a "biggest move"). Not scoped yet. Settle
  these in its Problem/Logic/Plan steps:
  - Cost: the Claude API is billed separately from the Claude Pro plan, pay per
    use. First part of this build that costs real money (small, not zero).
  - Honesty: news lines up with a move but rarely proves it caused it. Output
    says "likely," cites a source for every claim, and never states a cause as
    fact. No predictions, no advice. CLAUDE.md's "never invent data" still rules.
  - News source: not decided. If it's Alpha Vantage's news endpoint, it shares
    the 25 calls/day, which is one more reason v3 comes first.
  - Pipeline or agent? If the steps are fixed (get the move, get the news, one
    AI call to summarize), it's a simple AI pipeline, not an agent, and that's
    probably right. It only becomes an agent if the AI has to decide what to
    look up next (e.g. search again when the news doesn't match the move).
    Start simple; add that only if simple gives bad results. Describe it as
    what it is, not as an "agent" unless it actually is one.
  - How do we check the AI's answers are right? (This is "evals.")
- Later, order set by user feedback: simple stats (% change, high/low, second
  SQL rep), compare two tickers, automatic daily refresh on a schedule, mobile
  layout.

## Learning goal status
- SQL: done, 9/26/2026. First hand-written queries in Supabase's SQL editor:
  a `COUNT` with `WHERE` (rows for one ticker), and a `GROUP BY` with
  `COUNT`/`MIN`/`MAX` (rows + date range per ticker). Ahead of the 11/25
  target.
- Stretch query after v2: for one ticker, find the single biggest day-to-day
  price change in the stored history. Harder (compares each day to the one
  before it), and it's the exact input the v4 explainer needs.
- JOIN practice needs a second table. Not in v2.

## Every push
- Confirm no .env file or API key is being committed (.gitignore covers
  .env*, but check anyway). Keys stay in environment variables.

## Still owed
- Story step: short case study. Write it after v2 ("v1 had an empty chart,
  here's how I found it and fixed it").
