import { getNewsSentiment, formatAlphaVantageDate } from '../alpha-vantage';
import { generateNewsTags } from '../tag-generator'; // New import
import { ContentDocument } from '@/types/document';

/**
 * Fetches news articles from Alpha Vantage for given topics, processes them,
 * and transforms them into the ContentDocument format.
 *
 * @param topics A string containing one or more topics, comma-separated if multiple (e.g., "technology,ipo").
 * @param limit The maximum number of news articles to retrieve (defaults to 1000).
 * @returns A promise that resolves to an array of ContentDocument objects.
 */
export async function getProcessedNewsArticles(
  topics: string, // Changed from ticker
  limit: number = 1000
  // topics array parameter removed as it's now part of the main topics string if needed
): Promise<ContentDocument[]> {
  try {
    console.log(`Fetching news sentiment for topics: "${topics}" with limit: ${limit}`);
    // Pass topics string to the correct parameter in getNewsSentiment
    const newsResponse = await getNewsSentiment(topics, limit);

    if (!newsResponse || !newsResponse.feed || newsResponse.feed.length === 0) {
      console.log(`No news articles found for topics: "${topics}"`);
      return [];
    }

    console.log(`Received ${newsResponse.feed.length} news articles for topics: "${topics}". Processing...`);

    const processedArticles: ContentDocument[] = [];

    for (const item of newsResponse.feed) {
      const summary = item.summary || ''; // Ensure summary is not undefined
      const tags = await generateNewsTags(summary); // New call
      console.log(`Tags for article "${item.title}": ${tags.join(', ')}`);

      const contentDoc: ContentDocument = {
        content: summary,
        title: item.title,
        source_url: item.url,
        upload_time: item.time_published ? new Date(formatAlphaVantageDate(item.time_published)).toISOString() : new Date().toISOString(),
        author: item.authors?.length > 0 ? item.authors.join(', ') : item.source,
        source_type: 'news',
        tags: tags,
        description: summary,
        imageUrl: item.banner_image,
        raw_data: item, // Store the original AlphaVantage.NewsItem object
      };
      processedArticles.push(contentDoc);
    }

    console.log(`Successfully processed ${processedArticles.length} articles for topics: "${topics}".`);
    return processedArticles;

  } catch (error) {
    // Log the specific topics that caused the error for better debugging
    console.error(`Error in getProcessedNewsArticles for topics "${topics}":`, error);
    throw error;
  }
} 