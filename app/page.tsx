"use client";

import { useState, useEffect, FormEvent } from "react";
import PriceChart from "./components/PriceChart";
import ThemeToggle from "./components/ThemeToggle";
import { COMMON_TICKERS } from "@/lib/commonTickers";
import StatsDashboard, { Overview } from "./components/StatsDashboard";

type PriceResult = {
  ticker: string;
  price: number;
  date: string;
};

type Snapshot = {
  ticker: string;
  price: number;
  date: string;
};

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PriceResult | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<"1W" | "1M">("1W");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [recentTickers, setRecentTickers] = useState<string[]>([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);

  useEffect(() => {
    fetch("/api/tickers")
      .then((res) => (res.ok ? res.json() : { tickers: [] }))
      .then((data) => setRecentTickers(data.tickers ?? []))
      .catch(() => setRecentTickers([]));
  }, []);

  const typed = ticker.trim().toUpperCase();
  const recentMatches = recentTickers.filter((t) => t.startsWith(typed)).slice(0, 5);
  const popularMatches = COMMON_TICKERS.filter(
    (t) => t.startsWith(typed) && !recentMatches.includes(t)
  ).slice(0, 8 - recentMatches.length);

  const rangeDays = range === "1W" ? 7 : 30;
  const windowed = history.slice(-rangeDays);

  const previous = history.length >= 2 ? history[history.length - 2] : null;
  const change = result && previous ? result.price - previous.price : null;
  const changePercent = change !== null && previous ? (change / previous.price) * 100 : null;
  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setHistory([]);
    setOverview(null);
    setOverviewError(null);
    setOverviewLoading(true);

    try {
      const res = await fetch(`/api/price?ticker=${encodeURIComponent(ticker)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Couldn't load data right now, try again.");
        setOverviewLoading(false);
        return;
      }

      setResult(data);

      // History and fundamentals don't depend on each other, so fetch
      // them at the same time instead of one after another — otherwise
      // the fundamentals section (which is usually the slower of the
      // two) pops in late and shifts the chart down.
      const [historyRes, overviewRes] = await Promise.all([
        fetch(`/api/history?ticker=${encodeURIComponent(data.ticker)}`),
        fetch(`/api/overview?ticker=${encodeURIComponent(data.ticker)}`),
      ]);

      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.snapshots);
      }

      if (overviewRes.ok) {
        setOverview(await overviewRes.json());
      } else {
        const overviewErrorData = await overviewRes.json().catch(() => ({}));
        setOverviewError(
          overviewErrorData.error ?? "Fundamentals unavailable right now."
        );
      }
      setOverviewLoading(false);
    } catch {
      setError("Couldn't load data right now, try again.");
      setOverviewLoading(false);
    } finally {
      setLoading(false);
    }
  }

  const pillClass = isUp
    ? "bg-[var(--green-bg)] text-[var(--green)]"
    : isDown
    ? "bg-[var(--red-bg)] text-[var(--red)]"
    : "bg-[var(--surface-2)] text-[var(--text-muted)]";

  return (
    <div className="min-h-screen bg-[var(--bg)] font-sans text-[var(--text)]">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5 sm:px-10">
        <span className="text-lg font-extrabold tracking-tight">Stock Tracker</span>
        <ThemeToggle />
      </div>

      <main className="mx-auto flex w-full max-w-xl flex-col gap-7 px-4 py-12">
        <div className="relative">
          <label htmlFor="ticker-input" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Ticker symbol
          </label>
          <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
            <input
              id="ticker-input"
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              onFocus={() => setSuggestionsOpen(true)}
              onBlur={() => setSuggestionsOpen(false)}
              placeholder="e.g. AAPL"
              autoComplete="off"
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 font-mono text-sm font-semibold text-[var(--text)] outline-none focus:border-[var(--accent)]"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {loading ? "Loading…" : "Look up"}
            </button>
          </form>

          {suggestionsOpen && (recentMatches.length > 0 || popularMatches.length > 0) && (
            <div className="absolute left-0 right-[92px] top-[68px] z-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-md">
              <div className="flex items-center justify-between px-2 pb-1 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-faint)]">
                  {recentMatches.length > 0 ? "Recent" : "Popular"}
                </span>
                <button
                  type="button"
                  aria-label="Close suggestions"
                  onMouseDown={() => setSuggestionsOpen(false)}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-[var(--text-faint)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
              {recentMatches.map((t) => (
                <button
                  key={t}
                  type="button"
                  onMouseDown={() => {
                    setTicker(t);
                    setSuggestionsOpen(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left font-mono text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
                >
                  {t}
                </button>
              ))}
              {recentMatches.length > 0 && popularMatches.length > 0 && (
                <>
                  <div className="my-1.5 h-px bg-[var(--border)]" />
                  <div className="px-2 pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-faint)]">Popular</span>
                  </div>
                </>
              )}
              {popularMatches.map((t) => (
                <button
                  key={t}
                  type="button"
                  onMouseDown={() => {
                    setTicker(t);
                    setSuggestionsOpen(false);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left font-mono text-sm font-semibold text-[var(--text)] hover:bg-[var(--surface-2)]"
                >
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="rounded-xl bg-[var(--red-bg)] px-4 py-3 text-sm text-[var(--red)]">
            {error}
          </p>
        )}

        {result && (
          <div className="animate-[fadeIn_0.3s_ease] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-sm">
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-lg font-bold tracking-tight">{result.ticker}</span>
              <span className="text-xs text-[var(--text-faint)]">as of {result.date}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-4">
              <span className="font-mono text-4xl font-bold leading-none">
                ${result.price.toFixed(2)}
              </span>
              {change !== null && (
                <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-sm font-semibold ${pillClass}`}>
                  {isUp && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 4l8 12H4z" />
                    </svg>
                  )}
                  {isDown && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 20L4 8h16z" />
                    </svg>
                  )}
                  {change >= 0 ? "+" : ""}
                  ${Math.abs(change).toFixed(2)} ({change >= 0 ? "+" : ""}
                  {changePercent!.toFixed(2)}%)
                </span>
              )}
            </div>
          </div>
        )}

        <StatsDashboard overview={overview} loading={overviewLoading} error={overviewError} />

        {history.length > 0 && (
          <div className="animate-[fadeIn_0.3s_ease]">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                Price history
              </span>
              <div className="flex gap-1.5">
                {(["1W", "1M"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={
                      r === range
                        ? "rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-white"
                        : "rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-bold text-[var(--text-muted)]"
                    }
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <PriceChart data={windowed} />
          </div>
        )}

        {history.length > 0 && (
          <div className="animate-[fadeIn_0.3s_ease] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <div className="max-h-[340px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--surface)]">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Date
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {windowed
                  .slice()
                  .reverse()
                  .map((snapshot, i) => (
                    <tr key={snapshot.date} className={i % 2 === 1 ? "bg-[var(--surface-2)]" : undefined}>
                      <td className="px-4 py-2.5 font-mono text-[var(--text-muted)]">
                        {snapshot.date}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono font-semibold">
                        ${snapshot.price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
