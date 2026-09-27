import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data, error } = await supabase
    .from("snapshots")
    .select("ticker, date")
    .order("date", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Couldn't load tickers right now." },
      { status: 500 }
    );
  }

  // Ordered by date descending, so the first time we see a ticker here
  // is its most recent snapshot — deduping this way keeps the list
  // most-recently-looked-up first.
  const tickers = Array.from(new Set(data.map((row) => row.ticker)));
  return NextResponse.json({ tickers });
}
