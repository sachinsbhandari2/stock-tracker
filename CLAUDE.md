# Stock Tracker — Build 1

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

This is v1. It does NOT do: price predictions, news, earnings calls,
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
