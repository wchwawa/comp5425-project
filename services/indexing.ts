import { getTranscribedPodcastEpisodes } from './data-retrieve/podcast-data-retrieve';
import { addDocuments } from './rag';
const podcastSet = [
  "The Clark Howard Podcast",
  "Bloomberg Masters in Business Podcast", 
  "Goldman Sachs Exchanges",
  "CNBC's Fast Money Podcast",
  "Real Vision",
  "The Compound and Friends",
  "Rational Reminder Podcast",
  "M&A Science",
  "Australian Finance Podcast (Rask)",
  "The Ideas Exchange by ASX",
  "We Study Billionaires",
  "Motley Fool Money",
  "Invest Like the Best",
  "Equity Mates Investing Podcast",
  "Barron's Streetwise",
  "Chat With Traders",
  "CNBC's Fast Money",
  "The Investing for Beginners Podcast",
  "Mad Money w/ Jim Cramer",
  "Investing With IBD",
  "Wall Street Breakfast – Seeking Alpha",
  "The Meb Faber Show",
  "WSJ Your Money Briefing",
  "ETF Prime",
  "Option Alpha Podcast",
  "Animal Spirits",
  "ETF Spotlight - Zacks",
  "Stock Market Today with IBD",
  "The Ideas Exchange",
  "MarketBeat",
  "ETF Spotlight",
  "The Best One Yet"
];

  const filteredPodcastSet = Array.from(new Set(podcastSet));


export async function indexPodcastEpisodes() {
  try{
    const allEpisodesPromises = filteredPodcastSet.map(podcast => {

     try{ return getTranscribedPodcastEpisodes(podcast, 14);}
     catch(error){
      console.error('Error in indexPodcastEpisodes:', error);
      return [];
     }
    });

    const allEpisodesDataArrays = await Promise.all(allEpisodesPromises);

    for (let i = 0; i < filteredPodcastSet.length; i++) {
      const podcast = filteredPodcastSet[i];
      const episodesData = allEpisodesDataArrays[i];

      if (episodesData.length === 0) {
        console.log(`No episodes found for podcast: ${podcast}`);
        continue;
      }
      const docs = episodesData.map(episode => ({
        content:  episode.transcription?.slice(0, 8100) || 'no transcription',
        title: episode.title || 'Untitled Episode',
        source_url: episode.audio_url || '',
        source_type: 'podcast',
        tags: Array.isArray(episode.tags) ? episode.tags : [],
        description: episode.summary || '',
        imageUrl: episode.imageUrl || '',
        author: episode.author || '',
        upload_time: episode.isoDate || '',
        raw_data: episode.transcription || ''
      }));
      await addDocuments(docs);
    }
  } catch (error) {
    console.error('Error in indexPodcastEpisodes:', error);
    throw error;
  }
}


