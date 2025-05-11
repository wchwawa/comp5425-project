import { getTranscribedPodcastEpisodes } from "@/services/data-retrieve/podcast-data-retrieve";
const podcastSet = ["The Clark Howard Podcast", "Bloomberg Masters in Business Podcast", "Goldman Sachs Exchanges", "CNBC's Fast Money Podcast", "Real Vision", "The Compound and Friends", "Rational Reminder Podcast", "M&A Science", "Australian Finance Podcast (Rask)", "The Ideas Exchange by ASX",  "We Study Billionaires", "Motley Fool Money", "Invest Like the Best", "Equity Mates Investing Podcast", "Barron's Streetwise", "Chat With Traders", "CNBC's Fast Money", "The Investing for Beginners Podcast", "Mad Money w/ Jim Cramer", "Investing With IBD",   "Wall Street Breakfast – Seeking Alpha",
  "The Meb Faber Show",
  "WSJ Your Money Briefing",
  "ETF Prime",
  "Option Alpha Podcast",
  "Animal Spirits",
  "ETF Spotlight - Zacks",
  "Stock Market Today with IBD",
  "The Ideas Exchange", "MarketBeat", "ETF Spotlight", "The Best One Yet"];

/**
 * 测试单个podcast并处理错误
 */
async function testPodcast(podcastName: string): Promise<boolean> {
  try {
    const episodes = await getTranscribedPodcastEpisodes(podcastName, 1);
    console.log(`成功获取 "${podcastName}" 播客的一集`);
    console.log(`日期: ${episodes[0].isoDate}`);
    console.log(`作者: ${episodes[0].author}`);
    console.log("-------------------");
    return true;
  } catch (error) {
    console.log(`获取播客 "${podcastName}" 时出错: ${error instanceof Error ? error.message : '未知错误'}`);
    return false;
  }
}

/**
 * 测试所有播客列表
 */
async function main() {
  console.log("开始播客测试...");
  const failedPodcasts: string[] = [];
  
  // 测试每个播客
  for (const podcast of podcastSet) {
    const success = await testPodcast(podcast);
    if (!success) {
      failedPodcasts.push(podcast);
    }
  }
  
  // 打印测试总结
  console.log("\n=== 测试总结 ===");
  console.log(`总共测试播客数: ${podcastSet.length}`);
  console.log(`成功: ${podcastSet.length - failedPodcasts.length}`);
  console.log(`失败: ${failedPodcasts.length}`);
  
  if (failedPodcasts.length > 0) {
    console.log("\n失败的播客列表:");
    failedPodcasts.forEach((podcast, index) => {
      console.log(`${index + 1}. "${podcast}"`);
    });
  } else {
    console.log("\n所有播客测试均成功!");
  }
}

main();

// "Wall Street Breakfast – Seeking Alpha",
//   "The Meb Faber Show",
//   "WSJ Your Money Briefing",
//   "MarketBeat Minute",
//   "ETF Prime",
//   "Option Alpha Podcast",
//   "Animal Spirits",
//   "ETF Spotlight – Zacks",
//   "Stock Market Today with IBD",
//   "The Best One Yet (T-BOY)"