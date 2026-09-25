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

  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(
    ticker
  )}&apikey=${apiKey}`;

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

  const quote = data["Global Quote"];
  const price = quote?.["05. price"];
  const tradingDay = quote?.["07. latest trading day"];

  if (!price || !tradingDay) {
    return NextResponse.json({ error: `Ticker "${ticker}" not found.` }, { status: 404 });
  }

  const { error: saveError } = await supabase
    .from("snapshots")
    .upsert(
      { ticker, price: parseFloat(price), date: tradingDay },
      { onConflict: "ticker,date", ignoreDuplicates: true }
    );

  if (saveError) {
    console.error("Failed to save snapshot:", saveError);
  }

  return NextResponse.json({
    ticker,
    price: parseFloat(price),
    date: tradingDay,
  });
}
