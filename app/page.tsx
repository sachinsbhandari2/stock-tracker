"use client";

import { useState, FormEvent } from "react";
import PriceChart from "./components/PriceChart";

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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setHistory([]);

    try {
      const res = await fetch(`/api/price?ticker=${encodeURIComponent(ticker)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Couldn't load data right now, try again.");
        return;
      }

      setResult(data);

      const historyRes = await fetch(
        `/api/history?ticker=${encodeURIComponent(data.ticker)}`
      );
      const historyData = await historyRes.json();
      if (historyRes.ok) {
        setHistory(historyData.snapshots);
      }
    } catch {
      setError("Couldn't load data right now, try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 font-sans dark:bg-black">
      <main className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Stock Tracker
        </h1>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="Enter a ticker (e.g. AAPL)"
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {loading ? "Loading…" : "Look up"}
          </button>
        </form>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-4 rounded-md border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{result.ticker}</p>
            <p className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              ${result.price.toFixed(2)}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              as of {result.date}
            </p>
          </div>
        )}

        {history.length > 0 && <PriceChart data={history} />}

        {history.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-sm">
              <thead className="bg-zinc-100 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-zinc-600 dark:text-zinc-400">
                    Date
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-zinc-600 dark:text-zinc-400">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                {history
                  .slice(-10)
                  .reverse()
                  .map((snapshot) => (
                  <tr
                    key={snapshot.date}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                      {snapshot.date}
                    </td>
                    <td className="px-4 py-2 text-right text-zinc-900 dark:text-zinc-50">
                      ${snapshot.price.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
