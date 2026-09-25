import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim().toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "No ticker provided." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("snapshots")
    .select("ticker, price, date")
    .eq("ticker", ticker)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "Couldn't load history right now, try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ snapshots: data });
}
