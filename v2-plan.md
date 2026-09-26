# Stock Tracker v2 plan

Written 9/25/2026 after reading the actual v1 code. Build session planned for Saturday.

---

## The one-sentence version

v2 makes the chart useful on the very first lookup by pulling the last ~5 months
of real daily prices, instead of one price per visit.

---

## Why this is v2 (evidence, not a guess)

v1 calls Alpha Vantage's `GLOBAL_QUOTE` endpoint (in `app/api/price/route.ts`).
That endpoint returns **one** price: today's. So the chart only gains one dot per
ticker per day, and only if someone happens to look that ticker up.

You can see this in your own screenshot: GOOG has 2 dots after 2 days. A first-time
visitor looking up any ticker nobody has checked before sees a chart with a single
dot. Every new user hits this.

It's also a gap between the spec and the build. CLAUDE.md said "Alpha Vantage for
daily price history per ticker." v1 quietly built less than that. v2 makes the code
match the spec.

Why not wait for user feedback first: if friends tried the app today, the empty
chart would be the first thing every one of them mentioned, and it would drown out
anything else. Fix the known problem, then collect feedback on v2.

---

## Logic (plain English, no code)

**Input:** a ticker the user types.

**Rules:**
1. Ask Alpha Vantage for `TIME_SERIES_DAILY` with `outputsize=compact` instead of
   `GLOBAL_QUOTE`. This returns the last 100 trading days (about 5 months) of daily
   closing prices. It's free and still costs **one** API call per lookup, same as now.
2. Save every one of those days into the `snapshots` table. The table already
   refuses duplicate ticker + date rows, so looking the same ticker up again
   doesn't create copies. If a day already exists but the price is different,
   update it to Alpha Vantage's number (the newest data wins).
3. The big price card shows the most recent closing price, labeled with its real
   date (same as v1).
4. The chart shows every stored day for that ticker, and stays readable with ~100
   points (e.g. no dot on every point).
5. The table shows only the 10 most recent days, newest first. 100 rows is too many.

**Edge cases:**
- Ticker doesn't exist: Alpha Vantage returns an error instead of prices. Show
  "Ticker not found."
- Daily API limit hit: keep v1's behavior for now (an error message). Clearer
  wording is on the v3 list, so v2 stays one feature.
- API down or times out: same honest "couldn't load" message as v1.
- A new company with less than 100 days of trading history: save and show whatever
  comes back.
- Database save fails: still show the prices from the API, log the error (same as v1).

**Gate check:** could a smart person with no computer do this by hand from this page?
Yes. Look up the last 100 closing prices, write them in a notebook without repeating
a date, draw a line through them, and list the latest 10.

---

## Out of scope for v2 (don't build these yet)

- Skipping the API call when the database already has fresh data (that's v3)
- Automatic daily updates in the background
- Comparing two tickers
- Stats like % change or 52-week high/low
- Mobile layout work
- Any predictions, news, earnings, or analyst targets (still never, per CLAUDE.md)

---

## Your learning goal for v2 (you do this by hand, no AI writing it)

After v2 is working, open Supabase → SQL Editor and write these queries yourself.
The goal is SQL you can honestly say you wrote.

1. How many rows does GOOG have? (Run it before and after v2 so you can see the
   backfill worked. Before should be a handful, after should be about 100.)
2. For every ticker in the table, how many days are stored, and what's the earliest
   and latest date?

Words you'll need: `SELECT`, `FROM`, `WHERE`, `COUNT`, `MIN`, `MAX`, `GROUP BY`.
Write your attempt first. Then paste it into Claude **chat** (not Claude Code) and ask
it to check your query and explain any mistake, not to rewrite it for you.

Query #2 is the first `GROUP BY` you'll have written by hand. That's a real step
toward SQL you can do without AI.

---

## How iterating works (the plain-English version)

Think of your project like a Google Doc that the whole world can read.

- **`main` branch = the live site.** Whatever is on `main` is what people see at
  stock-tracker-2.vercel.app. You never experiment directly on `main`.
- **A branch = a safe copy.** Before changing anything, you make a copy called
  `v2-history`. All v2 work happens there. The live site doesn't change at all
  while you work. If v2 goes badly, you throw the copy away and nothing was harmed.
- **Preview link = a private test version.** Vercel can build your branch into its
  own test website with a long random URL that only you can open while logged in
  to Vercel. Same kind of URL as the weird one on Thursday that asked you to log
  in. It wasn't broken, it was private. That's exactly what you want now: test v2
  there before anyone else sees it.
- **Merge = go live.** When v2 works on the preview, you merge the branch into
  `main`. Vercel rebuilds the live site in a minute or two.
- **Rollback = undo button.** If something breaks after going live, Vercel's
  dashboard lets you roll back to the previous version while you fix it.

This is the answer to "how do I add a feature without messing up the rest." It's a
branch, not agents. The agent/worktree stuff from the video is for running several
features at the same time. You're doing one feature at a time, so a plain branch
is the right tool.

**One thing I couldn't check from here:** whether your Vercel project auto-deploys
from GitHub, or was deployed by Claude Code using the Vercel command-line tool. The
idea above is the same either way, but the exact buttons differ. Step 2 below has
Claude Code figure it out and explain it to you.

---

## The daily API limit (read this before testing)

Alpha Vantage's free key allows **25 calls per day, total**. Your live site and
your laptop use the same key, so they share those 25. Every lookup, including your
own testing, uses one.

On Saturday: test with **one** ticker at a time, and don't look up 15 tickers to
see if it works. If you hit the limit, the app will show an error until tomorrow.

When you share the link with friends later, 3-5 people doing a few lookups each is
fine. More than that and they'll hit the limit. That's why v3 is "stop wasting
calls" (see below).

---

## Saturday session, step by step

**Setup:** Open Cursor, open the `stock-tracker` folder, open Claude Code. Model:
Sonnet. Turn on plan mode (Shift+Tab cycles modes, or use the mode picker in the
Claude Code panel).

**Two habits for this session, not just this one:**
- **Claude Code proves it, you don't just take its word.** Before it says
  "done," it should actually run the app and check the result itself (build
  passes, app loads, a lookup works) rather than telling you to go check. If
  the Claude in Chrome browser extension is set up, it can even open the real
  deployed site and click around. If it's not set up yet, that's fine for
  Saturday — you'll still check the live site yourself in step 10 either way.
- **Every mistake this session becomes a CLAUDE.md line.** If Claude Code gets
  something wrong and you correct it, say "add a line to CLAUDE.md so you
  don't do that again" right then, not at the end. This is separate from step
  11's version-bump update.

1. **Paste the prompt below** into Claude Code.
2. **Claude Code checks how deploys work** (GitHub auto-deploy vs. command-line)
   and explains it. You read it and ask questions until it makes sense.
3. **Housekeeping on `main`:** commit `handoff.md` and this file (`v2-plan.md`).
   Neither is in the repo yet.
4. **Make the branch** `v2-history`.
5. **Plan mode:** Claude Code reads this file and proposes exactly which files it
   will change and how. Read it. Ask "why" about anything unclear. Approve only
   when you understand it.
6. **Build**, in small steps, on the branch.
7. **Claude Code proves it works before calling it done:** the build passes, the
   app runs on your laptop, and it looks up **one** ticker (AAPL) and shows about
   100 days in the chart. You look at it yourself in your browser too.
8. **Your SQL learning goal** in Supabase (above).
9. **Push the branch → preview.** Test v2 on the preview link.
10. **Merge to `main` → live.** Check stock-tracker-2.vercel.app yourself with one
    ticker.
11. **Update the docs:** CLAUDE.md (current version, plus a line for any mistake
    Claude Code made this session), `handoff.md` (what shipped, what's next), and
    README (fix the "What it does" section, see below).

**If something breaks after step 10:** roll back in Vercel first, then figure out
what went wrong on the branch. Don't try to hot-fix the live site.

---

## Prompt to paste into Claude Code on Saturday

> Read CLAUDE.md, handoff.md, and v2-plan.md. We're building v2 exactly as
> described in v2-plan.md, nothing extra.
>
> Before writing any code:
> 1. Tell me whether this Vercel project auto-deploys from GitHub or was deployed
>    with the Vercel CLI. Explain in plain English what that means for how we test
>    and ship v2 safely.
> 2. Commit handoff.md and v2-plan.md to main and push.
> 3. Create a branch called v2-history and switch to it.
> 4. Propose your plan for the v2 change (which files, what changes, in what
>    order) and wait for my approval.
>
> Rules for this session:
> - Explain each step like I'm new to this. I am.
> - Before you tell me anything is done, prove it: run the build, run the app
>   locally, and look up AAPL once. Only once, we have 25 API calls a day.
> - Don't merge to main until I say so.
> - Before every push, confirm no .env file or API key is being committed.
> - If you make a mistake I have to correct, add a line to CLAUDE.md so it
>   doesn't happen again.

---

## README fix to make in step 11

The README currently says repeat lookups on the same day "reuse the saved price."
The v1 code actually calls Alpha Vantage again every time. It just doesn't save a
duplicate row. Small, but the README is public and should say exactly what the app
does. v2 changes this section anyway, so fix the wording then.

---

## After v2: what's next (v3 and beyond, in order)

1. **Stop wasting API calls (v3).** If the database already has the latest trading
   day for a ticker, show it from the database and skip Alpha Vantage. Plus a
   clearer "daily data limit reached, try again tomorrow" message. This is what
   makes it safe to share the link widely.
2. **First AI feature (v4): "Why did it move?"** A button that uses the Claude API
   to explain the biggest move on the chart, using recent news, with a source link
   for every claim. Needs v2's history to exist first. Not scoped yet; the open
   questions (cost, honesty, news source, pipeline vs. agent, evals) are listed in
   handoff.md.
3. **Simple stats** from the stored data: 1-week and 1-month % change, high and low.
   Good second SQL rep.
4. **Compare two tickers** on one chart.
5. **Automatic daily refresh** on a schedule. This is where the "routines /
   scheduled tasks" idea from the video actually fits. Later, not now.
6. **Mobile layout pass.**

Real user feedback after v2 can reorder items 3-6. That's the point of getting it.

Still owed from v1: the **Story** step (a short case study: problem, what you
built, what you learned). Worth writing after v2, since "v1 had an empty chart, here's
how I found it and fixed it" is a better story than v1 alone.
