import { ChatOpenAI } from "@langchain/openai"
import {z} from "zod"

export const generateSymbolForTradingViewChart = async (query: string): Promise<{stockSymbols: string[][]}> => {
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 1.0,
  });

  const stockSymbolsSchema = z.array(z.string());

  const schema = z.object({
    stockSymbols: z.array(stockSymbolsSchema),
  });

  const prompt = `
You are a stock-ticker resolver.

TASK  
Given a natural-language **Query**, output **only** a single line of valid JSON with a "stocks" array containing multiple relevant stock tickers:

Each stock in the array should have:
  • "symbol" - the exact ticker (case-sensitive, no extra text), combined with the market, e.g.["NASDAQ:AAPL","NYSE:BTC","NYSE:DELL","BINANCE:ETH","NASDAQ:COIN","SSE:600519","NYSE:TSLA","NYSE:NIO","SZSE:002594","NYSE:PFIZER","NYSE:JNJ","NYSE:ABBV"]

The symbols should be valid for TradingView chart.
Return at least 2-3 relevant stocks when possible.
Output nothing else (no markdown, comments, or trailing characters).

THE USER QUERY
${query}

EXAMPLES
Query: How about latest news about Apple?  
→ [["NASDAQ:AAPL"]]

Query: What is the latest news about Crypto?  
→ [["BINANCE:BTC"],["BINANCE:ETH"],["NASDAQ:COIN"]]

Query: What is the latest news about KWEICHOW MOUTAI?  
→ [["SSE:600519"]]

Query: What is the latest news about electric vehicles?  
→ [["NASDAQ:TSLA"],["NYSE:NIO"],["SZSE:002594"]]

Query: What is the latest news about US medicine industry?  
→ [["NYSE:PFE"],["NYSE:JNJ"],["NYSE:ABBV"]]
  `

  const runnable = llm.withStructuredOutput(schema);
  const result = await runnable.invoke(prompt);
  return result;
}



export const generateSymbolForAlphaVantageNewsSentiment = async (query: string): Promise<{tickers: string}> => {
  const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.8,
  });

  const prompt = `
  You are a stock-ticker resolver.
  
  TASK
  Given a natural-language **Query**, output **exactly one line** of valid JSON:
  
  {"tickers":"TICKER[,TICKER...]"}
  
  Rules
  1. US-listed equities → bare ticker (e.g. "AAPL").
  2. Crypto assets → prefix with "CRYPTO:" (e.g. "CRYPTO:BTC").
  3. Currencies → prefix with "FOREX:" (e.g. "FOREX:USD").
  4. Combine multiple symbols with commas **and no spaces** (e.g. "AAPL,MSFT").
  5. Return 2-3 highly relevant symbols when possible; include all constituents for well-known groups.
  6. If the query refers exclusively to non-US markets, output {"tickers":""}.
  7. Output nothing except the JSON line (no markdown, comments, or trailing text).
  
  Alias Table (Examples, not exhaustive)
  - "mag7", "magnificent seven" → AAPL,MSFT,AMZN,GOOG,META,NVDA,TSLA
  - "fang", "faang"            → META,AMZN,AAPL,NFLX,GOOG
  - "crypto"                   → CRYPTO:BTC,CRYPTO:ETH,COIN
  
  EXAMPLES
  Query: How about latest news about Apple?
  → {"tickers":"AAPL"}
  
  Query: What is the latest news about Bitcoin and US dollar?
  → {"tickers":"CRYPTO:BTC,FOREX:USD,COIN"}
  
  Query: What is the latest news about cars industry?
  → {"tickers":"F,GM,TSLA"}
  
  Query: What is the latest news about medicine industry?
  → {"tickers":"PFE,JNJ,ABBV"}
  
  Query: give me latest news about mag7
  → {"tickers":"AAPL,MSFT,AMZN,GOOGL,META,NVDA,TSLA"}
  
  THE USER QUERY
  ${query}
  `;
  const schema = z.object({
    tickers: z.string(),
  });
  
  const runnable = llm.withStructuredOutput(schema);
  const result = await runnable.invoke(prompt);
  return result;
  
}