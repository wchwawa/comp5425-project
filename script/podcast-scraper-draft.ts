import Parser from 'rss-parser';

// Define interfaces for the data structures
interface EpisodeData {
  title?: string;
  link?: string;
  published?: string;
  published_parsed?: number; // timestamp
  summary?: string;
  description?: string;
  audio_url?: string;
  guid?: string;
  isoDate?: string;
}

interface ItunesPodcastSearchResult {
  feedUrl?: string;
}

interface ItunesSearchResponse {
  resultCount: number;
  results: ItunesPodcastSearchResult[];
}

/**
 * Fetches and parses a podcast RSS feed to extract episode information.
 *
 * @param rssUrl The URL of the podcast's RSS feed.
 * @returns A promise that resolves to an array of episode data objects.
 *          Returns an empty array if fetching or parsing fails.
 */
async function fetchPodcastEpisodes(rssUrl: string): Promise<EpisodeData[]> {
  const episodes: EpisodeData[] = [];
  const parser = new Parser<{}, Parser.Item>();

  try {
    // Fetch and parse the RSS feed
    const feed = await parser.parseURL(rssUrl);

    // Extract information for each episode
    feed.items.forEach((item: Parser.Item) => {
      const episodeData: EpisodeData = {
        title: item.title,
        link: item.link,
        published: item.pubDate,
        published_parsed: item.isoDate ? new Date(item.isoDate).getTime() : undefined,
        summary: item.summary || item.contentSnippet,
        description: item.content,
        audio_url: undefined,
        guid: item.guid,
        isoDate: item.isoDate,
      };

      if (item.enclosure && item.enclosure.url && item.enclosure.type && item.enclosure.type.startsWith('audio')) {
        episodeData.audio_url = item.enclosure.url;
      }
      episodes.push(episodeData);
    });

    return episodes;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error fetching or parsing RSS feed: ${error.message}`);
    } else {
      console.error('An unknown error occurred while fetching or parsing the RSS feed.');
    }
    return [];
  }
}

/**
 * Searches the iTunes API for a podcast and returns its RSS feed URL.
 *
 * @param podcastName The name of the podcast to search for.
 * @returns A promise that resolves to the RSS feed URL string, or null if not found or an error occurs.
 */
async function getPodcastRssUrl(podcastName: string): Promise<string | null> {
  try {
    const searchTerm = encodeURIComponent(podcastName);
    const searchUrl = `https://itunes.apple.com/search?term=${searchTerm}&entity=podcast&limit=1`;
    const response = await fetch(searchUrl, { method: 'GET' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json() as ItunesSearchResponse;

    if (data.resultCount > 0 && data.results[0]?.feedUrl) {
      return data.results[0].feedUrl;
    } else {
      console.log(`No podcast found with the name: ${podcastName}`);
      return null;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error searching for podcast: ${error.message}`);
    } else {
      console.error('An unknown error occurred during the podcast search.');
    }
    return null;
  }
}

// --- Example Usage ---
async function main() {
  const podcastNameToSearch = "The Daily";
  const rssFeedUrl = await getPodcastRssUrl(podcastNameToSearch);

  if (rssFeedUrl) {
    console.log(`Found RSS feed for '${podcastNameToSearch}': ${rssFeedUrl}`);

    const podcastEpisodes = await fetchPodcastEpisodes(rssFeedUrl);

    if (podcastEpisodes.length > 0) {
      console.log(`\n--- Episodes for ${podcastNameToSearch} ---`);
      podcastEpisodes.slice(0, 5).forEach((episode, index) => {
        console.log(`\nEpisode ${index + 1}:`);
        console.log(`  Title: ${episode.title || 'N/A'}`);
        console.log(`  Published: ${episode.published || 'N/A'}`);
        console.log(`  Summary: ${(episode.summary || 'N/A').substring(0, 150)}...`);
        console.log(`  Audio URL: ${episode.audio_url || 'N/A'}`);
      });
    } else {
      console.log("Could not fetch or parse podcast episodes.");
    }
  } else {
    console.log("Could not find RSS feed URL.");
  }
}

main().catch(error => {
  if (error instanceof Error) {
    console.error(`Unhandled error in main: ${error.message}`);
  } else {
    console.error('An unknown unhandled error occurred in main.');
  }
});

// To run this TypeScript code:
// 1. Make sure you have Node.js and npm (or yarn) installed.
// 2. Install TypeScript and necessary types:
//    npm install -g typescript
//    npm install rss-parser @types/rss-parser
//    (or yarn global add typescript; yarn add rss-parser @types/rss-parser)
// 3. Compile the TypeScript to JavaScript:
//    tsc podcast-scraper-draft.ts
// 4. Run the compiled JavaScript file:
//    node podcast-scraper-draft.js 