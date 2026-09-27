"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Snapshot = {
  date: string;
  price: number;
};

const ACCENT = "#6d63f5";

export default function PriceChart({ data }: { data: Snapshot[] }) {
  return (
    <div className="h-56 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.16} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.1} vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            width={48}
            tick={{ fontSize: 11, fill: "currentColor", opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(value) => `$${value}`}
          />
          <Tooltip
            formatter={(value) => [`$${Number(value).toFixed(2)}`, "Price"]}
            contentStyle={{
              borderRadius: 10,
              fontSize: 12,
              border: "1px solid rgba(128,128,128,0.3)",
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={ACCENT}
            strokeWidth={2}
            fill="url(#priceFill)"
            dot={false}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
