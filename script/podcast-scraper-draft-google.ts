import Parser from 'rss-parser';
import fetch from 'node-fetch'; // Kept for getPodcastRssUrl
import path from 'path'; // Kept for path.extname
import { Storage } from '@google-cloud/storage'; // Added for GCS
import { SpeechClient, protos } from '@google-cloud/speech'; // Added for Speech-to-Text
import axios from 'axios'; // Added for streaming downloads
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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
  gcs_uri?: string; // Added to store the GCS URI
  transcription?: string; // Added to store the audio transcription
  audio_content_type?: string; // MIME type from download
  audio_speech_encoding?: string; // Encoding hint for Speech-to-Text
  audio_speech_sample_rate_hertz?: number; // Sample rate hint for Speech-to-Text (often needs parsing library)
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
async function getEpisodeMetadataFromRss(rssUrl: string): Promise<EpisodeData[]> {
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
 * Sanitizes a string to be used as a filename or GCS object name component.
 * Replaces most non-alphanumeric characters with underscores.
 * @param name The string to sanitize.
 * @returns A sanitized string suitable for filenames or GCS object names.
 */
function sanitizeFilename(name: string): string {
  if (!name) return `file_${Date.now()}`;
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_').replace(/_+/g, '_');
}

/**
 * Downloads a podcast audio file from a URL and uploads it directly to Google Cloud Storage.
 *
 * @param audioUrl The URL of the podcast audio file.
 * @param bucketName The GCS bucket name.
 * @param destinationFileName The full path (including "folders") for the file in GCS.
 * @returns A promise that resolves when the upload is complete, or rejects on error.
 *          The promise resolves with an object containing the contentType of the downloaded audio.
 */
async function streamAudioToGoogleCloudStorage(
  audioUrl: string,
  bucketName: string,
  destinationFileName: string
): Promise<{ contentType?: string }> {
  const storage = new Storage(); // Assumes GOOGLE_APPLICATION_CREDENTIALS is set
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(destinationFileName);

  console.log(`Attempting to download from: ${audioUrl}`);
  console.log(`Uploading to gs://${bucketName}/${destinationFileName}`);

  try {
    const response = await axios({
      method: 'get',
      url: audioUrl,
      responseType: 'stream',
    });

    const contentType = response.headers['content-type'] as string | undefined;
    console.log(`Detected Content-Type: ${contentType || 'N/A'}`);

    const gcsWriteStream = file.createWriteStream({
      resumable: false, // Set to true for large files to enable resumable uploads
      // Optional: set metadata like content type
      // metadata: {
      //   contentType: response.headers['content-type'] || 'audio/mpeg',
      // },
    });

    response.data.pipe(gcsWriteStream);

    return new Promise<{ contentType?: string }>((resolve, reject) => {
      gcsWriteStream.on('finish', () => {
        console.log(`Successfully uploaded ${destinationFileName} to ${bucketName}.`);
        resolve({ contentType });
      });
      gcsWriteStream.on('error', (err: Error) => {
        console.error(`Error uploading ${destinationFileName} to GCS:`, err);
        reject(err);
      });
      response.data.on('error', (err: Error) => { // Error on the download stream
        console.error(`Error downloading ${audioUrl}:`, err);
        reject(err); // This will also cause the gcsWriteStream to error or be aborted.
      });
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error(`Axios error during GCS stream setup for ${audioUrl}: ${error.message}`);
        if (error.response) {
            console.error('Error status:', error.response.status);
        }
    } else if (error instanceof Error) {
      console.error(`Error setting up GCS stream for ${audioUrl}: ${error.message}`);
    } else {
      console.error(`An unknown error occurred while setting up GCS stream for ${audioUrl}.`);
    }
    throw error; // Re-throw to be caught by the caller, which will handle the episode update
  }
}

/**
 * Searches the iTunes API for a podcast and returns its RSS feed URL.
 *
 * @param podcastName The name of the podcast to search for.
 * @returns A promise that resolves to the RSS feed URL string, or null if not found or an error occurs.
 */
async function findPodcastRssUrlFromiTunes(podcastName: string): Promise<string | null> {
  try {
    const searchTerm = encodeURIComponent(podcastName);
    const searchUrl = `https://itunes.apple.com/search?term=${searchTerm}&entity=podcast&limit=1`;
    console.log(`Searching for podcast: ${searchUrl}`);
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

/**
 * Transcribes an audio file stored in Google Cloud Storage.
 *
 * @param gcsUri The GCS URI of the audio file (e.g., "gs://bucket-name/audio.mp3").
 * @param languageCode The BCP-47 language code of the audio (e.g., "en-US").
 * @param encoding Optional. The encoding of the audio file. If not provided, API will attempt to auto-detect.
 * @param sampleRateHertz Optional. The sample rate in Hertz of the audio file. If not provided, API will attempt to auto-detect.
 * @returns A promise that resolves to the transcribed text, or null if transcription fails.
 */
async function transcribeAudioFromGCS(
  gcsUri: string,
  languageCode: string = 'en-US',
  encoding?: string,
  sampleRateHertz?: number
): Promise<string | null> {
  const client = new SpeechClient(); // Assumes GOOGLE_APPLICATION_CREDENTIALS is set

  const audio = {
    uri: gcsUri,
  };
  const config: protos.google.cloud.speech.v1.IRecognitionConfig = {
    languageCode: languageCode,
    enableAutomaticPunctuation: true,
    // model: 'video', // Example, for higher quality on audio from video. For podcasts, default or 'phone_call' might be suitable.
                       // Use 'latest_long' for podcasts if available and appropriate.
  };

  if (encoding) {
    // Type assertion as a workaround for RecognitionConfig.AudioEncoding enum vs string
    config.encoding = encoding as unknown as protos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;
  }
  if (sampleRateHertz) {
    config.sampleRateHertz = sampleRateHertz;
  }

  const request = {
    audio: audio,
    config: config,
  };

  console.log(`Attempting to transcribe audio from: ${gcsUri}`);

  try {
    // Detects speech in the audio file using long-running recognition.
    const [operation] = await client.longRunningRecognize(request);

    // Waits for the long-running operation to complete.
    const [response] = await operation.promise();

    if (response.results && response.results.length > 0) {
      const transcription = response.results
        .map((result: protos.google.cloud.speech.v1.ISpeechRecognitionResult) => result.alternatives && result.alternatives[0] && result.alternatives[0].transcript ? result.alternatives[0].transcript : '')
        .join('\n');
      console.log(`Transcription successful for ${gcsUri}. Length: ${transcription.length}`);
      return transcription;
    } else {
      console.log(`No transcription results for ${gcsUri}. Response:`, JSON.stringify(response, null, 2));
      return null;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error during transcription for ${gcsUri}: ${error.message}`, error);
    } else {
      console.error(`An unknown error occurred during transcription for ${gcsUri}.`, error);
    }
    return null;
  }
}

/**
 * Gets a Speech API audio encoding hint from a MIME type.
 * @param contentType The MIME type string (e.g., "audio/mpeg").
 * @returns A string for Speech API's RecognitionConfig.AudioEncoding or undefined.
 */
function getSpeechEncodingFromContentType(contentType?: string): string | undefined {
  if (!contentType) return undefined;

  const lowerContentType = contentType.toLowerCase();

  if (lowerContentType.startsWith('audio/mpeg')) {
    return 'MP3';
  } else if (lowerContentType.startsWith('audio/wav') || lowerContentType.startsWith('audio/x-wav')) {
    return 'LINEAR16';
  } else if (lowerContentType.startsWith('audio/flac') || lowerContentType.startsWith('audio/x-flac')) {
    return 'FLAC';
  } else if (lowerContentType.startsWith('audio/ogg')) {
    // OGG can contain different codecs. OGG_OPUS is common for speech.
    // Speech API will attempt to auto-detect if this is not specific enough.
    return 'OGG_OPUS';
  } else if (lowerContentType.startsWith('audio/amr')) {
    return 'AMR'; // AMR Narrowband
  }
  // Note: AAC is not directly listed as a simple encoding type for Speech API without a container like MP4.
  // For other types, let the API attempt auto-detection.
  return undefined;
}

/**
 * Fetches and downloads a specified number of podcast episodes from an RSS feed,
 * uploading them to Google Cloud Storage.
 *
 * @param rssFeedUrl The URL of the podcast's RSS feed.
 * @param count The number of latest episodes to download (defaults to 5).
 * @param podcastName The name of the podcast, used for creating a subdirectory in GCS.
 * @param gcsBucketName The Google Cloud Storage bucket name.
 * @returns A promise that resolves when all attempted downloads and uploads are complete.
 */
export async function processPodcastAndUploadEpisodes(
  rssFeedUrl: string,
  count: number = 5,
  podcastName: string,
  gcsBucketName: string
): Promise<EpisodeData[]> {
  console.log(`Fetching episodes from RSS feed: ${rssFeedUrl}`);
  const allEpisodes = await getEpisodeMetadataFromRss(rssFeedUrl);
  let episodesToDownload: EpisodeData[] = [];

  if (!allEpisodes || allEpisodes.length === 0) {
    console.log("No episodes found or failed to fetch episodes from the RSS feed.");
    return episodesToDownload;
  }

  episodesToDownload = allEpisodes.slice(0, Math.min(count, allEpisodes.length));
  console.log(`Fetched ${allEpisodes.length} total episodes. Attempting to download and upload the latest ${episodesToDownload.length} to GCS.`);

  for (const episode of episodesToDownload) {
    if (episode.audio_url) {
      console.log(`
Processing Episode: ${episode.title || 'N/A'}`);
      try {
        // Sanitize podcastName and episode.title to create a safe folder and file name
        const podcastFolder = sanitizeFilename(podcastName);
        // Try to get file extension from URL, default to .mp3
        let fileExtension = path.extname(episode.audio_url);
        if (!fileExtension || fileExtension.length > 5 || fileExtension.length < 2) { // Basic check for valid extension
            const urlParts = episode.audio_url.split('?')[0].split('.'); // Remove query params before getting ext
            if (urlParts.length > 1) {
                fileExtension = '.' + urlParts.pop();
            } else {
                fileExtension = '.mp3'; // Default if no clear extension
            }
        }

        const episodeFileName = sanitizeFilename(episode.title || `episode_${episode.guid || Date.now()}`) + fileExtension;
        const destinationFileName = `${podcastFolder}/${episodeFileName}`; // e.g., "Podcast_Name/Episode_Title.mp3"

        console.log(`Attempting to download and upload "${episode.title}" to gs://${gcsBucketName}/${destinationFileName}`);
        const { contentType } = await streamAudioToGoogleCloudStorage(episode.audio_url, gcsBucketName, destinationFileName);

        episode.audio_content_type = contentType;
        episode.audio_speech_encoding = getSpeechEncodingFromContentType(contentType);
        // episode.audio_speech_sample_rate_hertz = undefined; // Explicitly undefined, needs parser library

        console.log(`Stored audio metadata for "${episode.title || 'N/A'}": Content-Type: ${episode.audio_content_type || 'N/A'}, Speech Encoding Hint: ${episode.audio_speech_encoding || 'N/A (API will auto-detect)'}`);

        // Store the GCS URI in the episode data
        episode.gcs_uri = `gs://${gcsBucketName}/${destinationFileName}`;
        console.log(`Stored GCS URI for "${episode.title || 'N/A'}": ${episode.gcs_uri}`);

        // Transcribe the audio from GCS
        if (episode.gcs_uri) {
          console.log(`Attempting transcription for "${episode.title || 'N/A'}" from ${episode.gcs_uri}`);
          try {
            const transcription = await transcribeAudioFromGCS(
              episode.gcs_uri,
              'en-US', // Default language code, can be parameterized
              episode.audio_speech_encoding,
              episode.audio_speech_sample_rate_hertz // Will be undefined for now
            );
            if (transcription) {
              episode.transcription = transcription;
              console.log(`Transcription added for "${episode.title || 'N/A'}". Preview: ${transcription.substring(0,100)}...`);
            } else {
              console.log(`Transcription failed or returned empty for "${episode.title || 'N/A'}".`);
              episode.transcription = "Transcription failed or not available.";
            }
          } catch (transcriptionError) {
            console.error(`Error during transcription call for episode "${episode.title || 'N/A'}":`, transcriptionError instanceof Error ? transcriptionError.message : transcriptionError);
            episode.transcription = "Transcription error.";
          }
        }

      } catch (error) {
        // Error is logged in streamAudioToGoogleCloudStorage, but we can add context
        console.error(`Failed processing episode "${episode.title || 'N/A'}" from ${episode.audio_url}: Ensure GCS permissions and URL validity.`, error instanceof Error ? error.message : error);
      }
    } else {
      console.log(`Skipping Episode: ${episode.title || 'N/A'} (no audio URL)`);
    }
  }
  console.log(`
Finished processing episodes for ${podcastName}.`);
  return episodesToDownload;
}

// --- Example Usage ---
async function main() {
  
  const podcastNameToSearch = "The Daily"; // Example podcast: Change this
  const numberOfEpisodesToGet = 1; // Number of latest episodes
  const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME; 

  if (!GCS_BUCKET_NAME || GCS_BUCKET_NAME.trim() === '') {
    console.error("---------------------------------------------------------------------");
    console.error("!!! CRITICAL: Please set your GCS_BUCKET_NAME in the .env file. !!!");
    console.error("    e.g., GCS_BUCKET_NAME=your-actual-bucket-name");
    console.error("---------------------------------------------------------------------");
    return;
  }

  console.log(`Searching for podcast: ${podcastNameToSearch}`);
  const rssFeedUrl = await findPodcastRssUrlFromiTunes(podcastNameToSearch);

  if (rssFeedUrl) {
    console.log(`Found RSS feed for '${podcastNameToSearch}': ${rssFeedUrl}`);
    const processedEpisodes = await processPodcastAndUploadEpisodes(rssFeedUrl, numberOfEpisodesToGet, podcastNameToSearch, GCS_BUCKET_NAME);
    console.log(`Finished all operations for ${podcastNameToSearch}.`);

    // Print the processed episode data
    console.log("\n--- Processed Episode Data ---");
    console.log(JSON.stringify(processedEpisodes, null, 2));
    console.log("-----------------------------");

  } else {
    console.log(`Could not find RSS feed URL for '${podcastNameToSearch}'.`);
  }
}

main().catch(error => {
  if (error instanceof Error) {
    console.error(`Unhandled error in main: ${error.message}`);
  } else {
    console.error('An unknown unhandled error occurred in main.');
  }
});

