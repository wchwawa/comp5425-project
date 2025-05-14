import { getNewsSentiment } from "@/services/alpha-vantage";
import { generateSymbolForAlphaVantageNewsSentiment, generateSymbolForTradingViewChart } from "@/services/ticker-generator";

const main = async () => {
  const query = "ev cars industry?";
  const symbol = await generateSymbolForTradingViewChart(query);
  console.log(symbol);

  // const data = await generateSymbolForAlphaVantageNewsSentiment(query);
  // console.log(data.tickers);
  // const news = await getNewsSentiment(data.tickers);
  // console.log(news);
};

main();
