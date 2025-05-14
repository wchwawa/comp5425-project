import { generateSymbolForTradingViewChart } from "@/services/ticker-generator";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { query } = await request.json();
  // generate tags for query
  const data = await generateSymbolForTradingViewChart(query);
  console.log(' API: fetchSimpleChartSymbol=====================', data);
  return NextResponse.json({ stockSymbols: data.stockSymbols });
}
