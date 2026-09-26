import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

  const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${encodeURIComponent(
    ticker
  )}&outputsize=compact&apikey=${apiKey}`;

  let data: any;
  try {
    const response = await fetch(url);
    data = await response.json();
  } catch {
    return NextResponse.json(
      { error: "Couldn't load data right now, try again." },
      { status: 502 }
    );
  }

  if (data["Note"] || data["Information"]) {
    return NextResponse.json(
      { error: "Couldn't load data right now, try again." },
      { status: 429 }
    );
  }

  const series = data["Time Series (Daily)"];

  if (data["Error Message"] || !series || Object.keys(series).length === 0) {
    return NextResponse.json({ error: `Ticker "${ticker}" not found.` }, { status: 404 });
  }

  const dates = Object.keys(series).sort();
  const latestDate = dates[dates.length - 1];

  const rows = dates.map((date) => ({
    ticker,
    price: parseFloat(series[date]["4. close"]),
    date,
  }));

  const latestPrice = rows[rows.length - 1].price;

  const { error: saveError } = await supabase
    .from("snapshots")
    .upsert(rows, { onConflict: "ticker,date" });

  if (saveError) {
    console.error("Failed to save snapshot:", saveError);
  }

  return NextResponse.json({
    ticker,
    price: latestPrice,
    date: latestDate,
  });
}
