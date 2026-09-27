import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const CACHE_DAYS = 30;

function getTodayEastern(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function daysBetween(earlier: string, later: string): number {
  const ms = new Date(later).getTime() - new Date(earlier).getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function parseNumberOrNull(value?: string): number | null {
  if (!value || value === "None" || value === "-") return null;
  const parsed = parseFloat(value);
  return Number.isNaN(parsed) ? null : parsed;
}

type OverviewRow = {
  ticker: string;
  pe_ratio: number | null;
  peg_ratio: number | null;
  eps: number | null;
  market_cap: number | null;
  week_52_high: number | null;
  week_52_low: number | null;
  checked_on: string;
};

function toResponseShape(row: OverviewRow) {
  return {
    ticker: row.ticker,
    peRatio: row.pe_ratio,
    pegRatio: row.peg_ratio,
    eps: row.eps,
    marketCap: row.market_cap,
    week52High: row.week_52_high,
    week52Low: row.week_52_low,
  };
}

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim().toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "No ticker provided." }, { status: 400 });
  }

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing an Alpha Vantage API key." },
      { status: 500 }
    );
  }

  const todayEastern = getTodayEastern();

  const { data: cachedRow } = await supabase
    .from("company_overview")
    .select("*")
    .eq("ticker", ticker)
    .maybeSingle();

  if (cachedRow && daysBetween(cachedRow.checked_on, todayEastern) < CACHE_DAYS) {
    return NextResponse.json(toResponseShape(cachedRow));
  }

  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${encodeURIComponent(
    ticker
  )}&apikey=${apiKey}`;

  let data: any;
  try {
    const response = await fetch(url);
    data = await response.json();
  } catch {
    return NextResponse.json(
      { error: "Couldn't load stats right now, try again." },
      { status: 502 }
    );
  }

  if (data["Note"] || data["Information"]) {
    if (cachedRow) {
      return NextResponse.json(toResponseShape(cachedRow));
    }
    return NextResponse.json(
      { error: "Daily lookup limit reached — try again tomorrow." },
      { status: 429 }
    );
  }

  const row: OverviewRow = {
    ticker,
    pe_ratio: parseNumberOrNull(data.PERatio),
    peg_ratio: parseNumberOrNull(data.PEGRatio),
    eps: parseNumberOrNull(data.EPS),
    market_cap: parseNumberOrNull(data.MarketCapitalization),
    week_52_high: parseNumberOrNull(data["52WeekHigh"]),
    week_52_low: parseNumberOrNull(data["52WeekLow"]),
    checked_on: todayEastern,
  };

  const { error: saveError } = await supabase.from("company_overview").upsert(row);
  if (saveError) {
    console.error("Failed to save company_overview:", saveError);
  }

  return NextResponse.json(toResponseShape(row));
}
