import { generateSymbolForAlphaVantageNewsSentiment } from "@/services/ticker-generator";
import { getNewsSentiment } from "@/services/alpha-vantage";
const main = async () => {
  // const data = await generateSymbolForAlphaVantageNewsSentiment("What is the latest news about mag 7?");
  // const ticker = data.tickers;
  // console.log(ticker);
  const news = await getNewsSentiment("AAPL");
  console.log(news.feed.filter(item => item.topics));
};

main();
