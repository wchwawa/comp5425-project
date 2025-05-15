import { getTranscribedPodcastEpisodes } from './data-retrieve/podcast-data-retrieve';
import { getProcessedNewsArticles } from './data-retrieve/news-data-retrieve';
import { embeddingContentDocuments } from './rag';
import { insertNewsTags, insertAudioTags } from '@/utils/supabase/queries';
import { generateAudioTags } from './tag-generator';

const podcastSet = [
  "The Clark Howard Podcast", "Bloomberg Masters in Business Podcast", "Goldman Sachs Exchanges", 
  "CNBC's Fast Money Podcast", "Real Vision", "The Compound and Friends", "Rational Reminder Podcast", 
  "M&A Science", "Australian Finance Podcast (Rask)", "The Ideas Exchange by ASX",  
  "We Study Billionaires", "Motley Fool Money", "Invest Like the Best", "Equity Mates Investing Podcast", 
  "Barron's Streetwise", "Chat With Traders", "CNBC's Fast Money", "The Investing for Beginners Podcast", 
  "Mad Money w/ Jim Cramer", "Investing With IBD", "Wall Street Breakfast - Seeking Alpha",
  "The Meb Faber Show", "WSJ Your Money Briefing", "ETF Prime", "Option Alpha Podcast", 
  "Animal Spirits", "ETF Spotlight - Zacks", "Stock Market Today with IBD", "The Ideas Exchange", 
  "MarketBeat", "ETF Spotlight", "The Best One Yet"
];
const filteredPodcastSet = Array.from(new Set(podcastSet));



// Define the set of topics for news indexing
// Refer to Alpha Vantage documentation for available topics: e.g., blockchain, earnings, ipo, mergers_and_acquisitions, etc.
const newsTopicSet: string[] = [
  'technology,earnings',
  // 'manufacturing,earnings',
  // 'technology,ipo'
]; // Ex  ample topics

export async function indexPodcastEpisodes(countPerPodcast: number = 14) {
  console.log(`Starting podcast indexing for ${filteredPodcastSet.length} podcasts, ${countPerPodcast} episodes each.`);
  try {
    for (const podcast of filteredPodcastSet) {
      console.log(`Fetching episodes for podcast: ${podcast}`);
      const episodesData = await getTranscribedPodcastEpisodes(podcast, countPerPodcast);
      if (!episodesData || episodesData.length === 0) {
        console.log(`No episodes found or failed to fetch for podcast: ${podcast}`);
        continue;
      }
      console.log(`Retrieved ${episodesData.length} episodes for ${podcast}. Processing...`);

      const docsToEmbed = [];
      for (const episode of episodesData) {
        const summary = episode.summary?.trim() || 'no summary';
        const tags = episode.tags || [];
        docsToEmbed.push({
          content: summary,
          title: episode.title || 'Untitled Episode',
          source_url: episode.audio_url || '',
          source_type: 'podcast',
          tags: tags,
          description: episode.summary || '',
          imageUrl: episode.imageUrl || '',
          author: episode.author || '',
          upload_time: episode.isoDate || '',
          raw_data: episode
        });
      }
      
      if (docsToEmbed.length > 0) {
        console.log(`Embedding ${docsToEmbed.length} documents for podcast: ${podcast}`);
        await embeddingContentDocuments(docsToEmbed);
        console.log(`Successfully embedded documents for podcast: ${podcast}`);
      } else {
        console.log(`No documents to embed for podcast: ${podcast}`);
      }
    }
    console.log('Podcast indexing completed.');
  } catch (error) {
    console.error('Error in indexPodcastEpisodes:', error);
  }
}

export async function indexNewsData(limitPerTopic: number = 50, topics: string[] = newsTopicSet) { // Limit for news articles per topic
  console.log(`Starting news indexing for ${topics.length} topics, up to ${limitPerTopic} articles each.`);
  try {
    const allNewsDocs = [];
    for (let i = 0; i < topics.length; i++) {
      const topic = topics[i];
      const topicNumber = i + 1;
      console.log(`(${topicNumber}/${topics.length}) Fetching news for topic: "${topic}"`);
      // getProcessedNewsArticles now takes a single topic string
      const newsDocs = await getProcessedNewsArticles(topic, limitPerTopic);
      
      if (!newsDocs || newsDocs.length === 0) {
        console.log(`(${topicNumber}/${topics.length}) No news articles found for topic: "${topic}"`);
        continue;
      }
      console.log(`(${topicNumber}/${topics.length}) Retrieved ${newsDocs.length} articles for topic: "${topic}".`);

      for (const doc of newsDocs) {
        if (doc.tags && doc.tags.length > 0) {
          await insertNewsTags(doc.tags);
        }
      }
      allNewsDocs.push(...newsDocs);
    }

    if (allNewsDocs.length > 0) {
      console.log(`Embedding ${allNewsDocs.length} total news documents.`);
      await embeddingContentDocuments(allNewsDocs);
      console.log('Successfully embedded all news documents.');
    } else {
      console.log('No news documents to embed in total.');
    }
    console.log('News indexing completed.');
  } catch (error) {
    console.error('Error in indexNewsData:', error);
  }
}



