import { indexNewsData } from "@/services/indexing";
import { indexPodcastEpisodes } from "@/services/indexing";

/**
 * config the topics you want to index, 
 * see valid topics here: https://www.alphavantage.co/documentation/#news-sentiment
 * @format: the string inside topics[] is the topic you want to index, and combine them with ","
 * @example: ['technology,earnings']
 */
const topics = [
  ''
];
const main = async () => {
  await indexNewsData(50, topics); //you can ONLY index 50 or 1000 news articles at a time
  await indexPodcastEpisodes(14); // This paramater is the number of podcast episodes of each frontier podcast account (pre-set), don't index more than 14 at a time
}

main();