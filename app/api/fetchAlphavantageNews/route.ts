import { NextRequest, NextResponse } from "next/server";
import { getNewsSentiment, processNewsData } from "@/services/alpha-vantage";
import { generateSymbolForAlphaVantageNewsSentiment } from "@/services/ticker-generator";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { query } = await request.json();
  const ticker = await generateSymbolForAlphaVantageNewsSentiment(query);

  console.log('API:', ticker);
  if (!ticker || ticker.tickers.length === 0) {
    return NextResponse.json({ error: "invalid ticker found, please try other query" }, { status: 400 });
  }
  const rawNewsData = await getNewsSentiment(ticker.tickers);
  // Process the news data
  const processedNews = processNewsData(rawNewsData);

  return NextResponse.json({ news: processedNews }); // Return processed news
}

