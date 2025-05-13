import { getTranscribedPodcastEpisodes } from './data-retrieve/podcast-data-retrieve';
import { addDocuments } from './rag';
const podcastSet = [
  "The Clark Howard Podcast",
  // "Bloomberg Masters in Business Podcast", 
  // "Goldman Sachs Exchanges",
  // "CNBC's Fast Money Podcast",
  // "Real Vision",
  // "The Compound and Friends",
  // "Rational Reminder Podcast",
  // "M&A Science",
  // "Australian Finance Podcast (Rask)",
  // "The Ideas Exchange by ASX",
  // "We Study Billionaires",
  // "Motley Fool Money",
  // "Invest Like the Best",
  // "Equity Mates Investing Podcast",
  // "Barron's Streetwise",
  // "Chat With Traders",
  // "CNBC's Fast Money",
  // "The Investing for Beginners Podcast",
  // "Mad Money w/ Jim Cramer",
  // "Investing With IBD",
  // "Wall Street Breakfast – Seeking Alpha",
  // "The Meb Faber Show",
  // "WSJ Your Money Briefing",
  // "ETF Prime",
  // "Option Alpha Podcast",
  // "Animal Spirits",
  // "ETF Spotlight - Zacks",
  // "Stock Market Today with IBD",
  // "The Ideas Exchange",
  // "MarketBeat",
  // "ETF Spotlight",
  // "The Best One Yet"
];

  const filteredPodcastSet = Array.from(new Set(podcastSet));


export async function indexPodcastEpisodes() {
  try{
    for (const podcast of filteredPodcastSet) {
      // TODO Remove duplicate of episodes from database
      const episodesData = await getTranscribedPodcastEpisodes(podcast, 2);
      if (episodesData.length === 0) {
        console.log(`No episodes found for podcast: ${podcast}`);
        continue;
      }
      const docs = episodesData.map(episode => ({
        content:  episode.transcription || 'no transcription',
        title: episode.title || 'Untitled Episode',
        source_url: episode.audio_url || '',
        source_type: 'podcast',
        tags: Array.isArray(episode.tags) ? episode.tags : [],
        description: episode.summary || '',
        imageUrl: episode.imageUrl || '',
        author: episode.author || '',
        upload_time: episode.isoDate || '',
      }));
      await addDocuments(docs);
    }
  } catch (error) {
    console.error('Error in indexPodcastEpisodes:', error);
    throw error;
  }
}


