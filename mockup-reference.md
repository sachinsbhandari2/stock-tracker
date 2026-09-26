# v2/v3 layout reference (not a spec — see v2-plan.md for the actual logic)

Same page structure as v1, same styling (zinc/black, rounded borders, blue
line chart). No new visual design needed. Additions:

1. Price card (existing): add a second line under the date —
   "from database, no API call used" when the price came from cache (v3
   only; not part of v2).
2. Chart (existing): now plots ~100 stored days instead of ~2.
3. New: a row of 3 small stat boxes between the chart and the table —
   1-month % change, 100-day high, 100-day low. (Not in v2's scope per
   v2-plan.md — v2 is history/chart only. Stats are listed as a later
   version. Ignore this box for v2, keep it for whenever stats are built.)
4. Table (existing): still shows recent days, newest first; note text
   changes to reflect ~100 stored days instead of ~2.

Nothing else changes. No new pages, no new components beyond what v1
already has (PriceChart, the results card, the table).
