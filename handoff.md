# Handoff: Stock Tracker

Last updated 9/25/2026. Read this first, then v2-plan.md.

## Current state: v1, shipped 9/24/2026
- Live: https://stock-tracker-2.vercel.app/
- Code: https://github.com/sachinsbhandari2/stock-tracker
- What it does: type a ticker, the app gets today's price from Alpha Vantage
  (GLOBAL_QUOTE), saves one row (ticker, price, date) to Supabase, and shows a
  chart and table of whatever rows exist for that ticker.
- Built with: Next.js, Supabase (Postgres), Alpha Vantage, Recharts, Vercel,
  directed through Cursor + Claude Code.

## What's broken or rough
- **Chart is nearly empty for any new ticker.** v1 saves one price per lookup,
  so history only grows one dot per day. This is the v2 fix.
- **Every lookup calls Alpha Vantage**, even when the database already has the
  data. Free key = 25 calls per day, shared by the live site and local testing.
- **README wording:** says repeat lookups "reuse the saved price." The code
  actually re-calls the API and just skips saving a duplicate. Fix during v2.
- **Rate-limit message** is generic ("try again") even though the limit is daily.

## Next step: v2 (planned for Saturday 9/26)
Full plan, logic, and the prompt to paste into Claude Code are in v2-plan.md.
Short version: switch to TIME_SERIES_DAILY (compact) so one lookup saves the
last ~100 trading days and the chart is useful immediately. Build on a branch
called v2-history, test on the Vercel preview, then merge.

User feedback comes after v2, not before. The empty chart would dominate any
feedback on v1.

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
- SQL: not started. v2 includes the first hand-written queries (see
  v2-plan.md). Target: first hand-written query by 11/25.
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
