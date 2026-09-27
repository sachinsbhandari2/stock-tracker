export type Overview = {
  ticker: string;
  peRatio: number | null;
  pegRatio: number | null;
  eps: number | null;
  marketCap: number | null;
  week52High: number | null;
  week52Low: number | null;
};

function formatMarketCap(value: number | null): string {
  if (value === null) return "—";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function formatNumber(value: number | null, prefix = ""): string {
  return value === null ? "—" : `${prefix}${value.toFixed(2)}`;
}

const LABELS = ["P/E Ratio", "PEG Ratio", "EPS", "Market Cap", "52W High", "52W Low"];

export default function StatsDashboard({
  overview,
  loading,
  error,
}: {
  overview: Overview | null;
  loading: boolean;
  error: string | null;
}) {
  if (!overview && !loading && !error) return null;

  if (error && !loading) {
    return (
      <div className="animate-[fadeIn_0.3s_ease]">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
          Fundamentals
        </span>
        <div className="mt-2 rounded-xl bg-[var(--surface-2)] px-4 py-3.5 text-sm text-[var(--text-muted)]">
          {error}
        </div>
      </div>
    );
  }

  const tiles = overview
    ? [
        { label: "P/E Ratio", value: formatNumber(overview.peRatio) },
        { label: "PEG Ratio", value: formatNumber(overview.pegRatio) },
        { label: "EPS", value: formatNumber(overview.eps, "$") },
        { label: "Market Cap", value: formatMarketCap(overview.marketCap) },
        { label: "52W High", value: formatNumber(overview.week52High, "$") },
        { label: "52W Low", value: formatNumber(overview.week52Low, "$") },
      ]
    : LABELS.map((label) => ({ label, value: null }));

  return (
    <div className="animate-[fadeIn_0.3s_ease]">
      <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
        Fundamentals
      </span>
      <div className="mt-2 grid grid-cols-3 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl bg-[var(--surface-2)] px-4 py-3.5">
            <div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              {tile.label}
            </div>
            {tile.value === null ? (
              <div className="mt-2 h-5 w-14 animate-pulse rounded bg-[var(--border)]" />
            ) : (
              <div
                className={`mt-1.5 font-mono text-lg font-semibold ${
                  tile.value === "—" ? "text-[var(--text-faint)]" : "text-[var(--text)]"
                }`}
              >
                {tile.value}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
