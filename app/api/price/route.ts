import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function getTodayEastern(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date()); // "YYYY-MM-DD"
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

  const { data: checkedRow, error: checkedError } = await supabase
    .from("last_checked")
    .select("checked_on")
    .eq("ticker", ticker)
    .maybeSingle();

  if (checkedError) {
    console.error("Failed to check last_checked:", checkedError);
  }

  if (checkedRow?.checked_on === todayEastern) {
    const { data: latestSnapshot } = await supabase
      .from("snapshots")
      .select("ticker, price, date")
      .eq("ticker", ticker)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestSnapshot) {
      return NextResponse.json({
        ticker,
        price: latestSnapshot.price,
        date: latestSnapshot.date,
      });
    }

    return NextResponse.json({ error: `Ticker "${ticker}" not found.` }, { status: 404 });
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
    await supabase.from("last_checked").upsert({ ticker, checked_on: todayEastern });

    const { data: cachedSnapshot } = await supabase
      .from("snapshots")
      .select("ticker, price, date")
      .eq("ticker", ticker)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (cachedSnapshot) {
      return NextResponse.json({
        ticker,
        price: cachedSnapshot.price,
        date: cachedSnapshot.date,
      });
    }

    return NextResponse.json(
      { error: "Daily lookup limit reached — try again tomorrow." },
      { status: 429 }
    );
  }

  const series = data["Time Series (Daily)"];

  if (data["Error Message"] || !series || Object.keys(series).length === 0) {
    await supabase.from("last_checked").upsert({ ticker, checked_on: todayEastern });
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

  await supabase.from("last_checked").upsert({ ticker, checked_on: todayEastern });

  return NextResponse.json({
    ticker,
    price: latestPrice,
    date: latestDate,
  });
}
