import Parser from 'rss-parser';
import fs from 'fs-extra'; // Added for file system operations
import { OpenAIClient } from '@/utils/openai/client'; // Added for OpenAI API
import fetch from 'node-fetch'; // Added for downloading audio files
import path from 'path'; // Added for path manipulation
import os from 'os'; // Added for temporary directory
import { exec } from 'child_process'; // Added for running ffmpeg
import { promisify } from 'util'; // Added for promisifying exec
import { generateTagsForDocument } from '../tag-generator';
import { insertAudioTags } from '@/utils/supabase/queries';
const execAsync = promisify(exec); // Promisify exec for async/await usage

const OPENAI_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const TARGET_AUDIO_BITRATE = "48k"; // Target bitrate for compression
const TARGET_AUDIO_TEMPO = 1.2; // Target tempo (20% faster)

// Define interfaces for the data structures
interface EpisodeData {
  title?: string;
  author?: string;
  link?: string;
  published?: string;
  published_parsed?: number; // timestamp
  summary?: string;
  description?: string;
  audio_url?: string;
  guid?: string;
  isoDate?: string;
  transcription?: string; // Added for storing transcription
  tags?: string[];
  imageUrl?: string;
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

    // Get author information from the feed
    const channelAuthor = (feed as any).itunes?.author || 
                          (feed as any).creator || 
                          (feed as any).itunes?.owner?.name || 
                          (feed as any).managingEditor?.split('(')[1]?.split(')')[0] || 
                          undefined;

    // Extract information for each episode
    feed.items.forEach((item: Parser.Item) => {
      const episodeData: EpisodeData = {
        title: item.title,
        author: (item as any).itunes?.author || (item as any).creator || channelAuthor,
        link: item.link,
        published: item.pubDate,
        published_parsed: item.isoDate ? new Date(item.isoDate).getTime() : undefined,
        summary: item.summary || item.contentSnippet,
        description: item.content,
        audio_url: undefined, // Initialize with undefined, will be set by the enclosure check
        guid: item.guid,
        isoDate: item.isoDate,
        imageUrl: (item as any).itunes?.image || (item as any)['media:thumbnail']?.$?.url || (item as any).image?.url || (feed as any).image?.url || undefined
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
 * Compresses an audio file using ffmpeg to change its tempo and bitrate.
 *
 * @param inputPath The path to the input audio file.
 * @param outputPath The path to save the compressed audio file.
 * @param tempo The target audio tempo (e.g., 1.0 for original, 1.2 for 20% faster).
 * @param bitrate The target audio bitrate (e.g., "64k", "48k").
 * @returns A promise that resolves to true if compression was successful, false otherwise.
 */
async function compressAudio(inputPath: string, outputPath: string, tempo: number, bitrate: string): Promise<boolean> {
  const ffmpegCommand = `ffmpeg -y -i "${inputPath}" -filter:a "atempo=${tempo}" -b:a ${bitrate} "${outputPath}"`;
  console.log(`Attempting to compress audio with command: ${ffmpegCommand}`);
  try {
    const { stdout, stderr } = await execAsync(ffmpegCommand);
    if (stderr && !stderr.includes('Output file #0 does not contain any stream')) { // ffmpeg can output to stderr on success
      // Check for known "success" messages or patterns in stderr if necessary
      // For now, we'll consider stderr content (not matching specific non-errors) as a potential issue
      // but proceed if the output file is created.
      const knownSuccessPatterns = /size=.*time=/; // Example pattern indicating progress/completion
      if (!knownSuccessPatterns.test(stderr)) {
        console.warn(`ffmpeg stderr (potential issue or verbose output): ${stderr}`);
      }
    }
    // Verify that the output file was created and has a size
    if (await fs.pathExists(outputPath) && (await fs.stat(outputPath)).size > 0) {
      console.log(`Audio compressed successfully to ${outputPath}`);
      return true;
    } else {
      console.error(`ffmpeg output file ${outputPath} not found or is empty after command execution.`);
      if(stderr) console.error(`ffmpeg stderr: ${stderr}`);
      if(stdout) console.log(`ffmpeg stdout: ${stdout}`);
      return false;
    }
  } catch (error) {
    console.error('Error during ffmpeg compression:', error);
    return false;
  }
}

/**
 * Transcribes an audio file from a URL using the OpenAI API.
 * If the file is too large, it attempts to compress it first.
 *
 * @param audioUrl The URL of the audio file to transcribe.
 * @param openai The OpenAI API client instance.
 * @returns A promise that resolves to the transcription text, or null/error message if an error occurs.
 */
async function transcribeAudio(audioUrl: string): Promise<string | null> {
  if (!audioUrl) {
    console.log("No audio URL provided for transcription.");
    return null;
  }

  const tempDir = path.join(os.tmpdir(), 'podcast_audio');
  await fs.ensureDir(tempDir);
  const originalFileName = `original_${Date.now()}_${path.basename(new URL(audioUrl).pathname).replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
  let tempFilePath = path.join(tempDir, originalFileName);
  let compressedFilePath: string | null = null;
  let fileToTranscribe = tempFilePath;
  let usingCompressedFile = false;

  try {
    console.log(`Downloading audio from: ${audioUrl}`);
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to download audio file: ${response.status} ${response.statusText} from ${audioUrl}`);
    }
    if (!response.body) {
      throw new Error(`Response body is null, cannot download audio from ${audioUrl}.`);
    }

    const fileStream = fs.createWriteStream(tempFilePath);
    await new Promise((resolve, reject) => {
      response.body!.pipe(fileStream);
      response.body!.on("error", reject);
      fileStream.on("finish", resolve);
    });
    console.log(`Audio downloaded to: ${tempFilePath}`);

    let stats = await fs.stat(tempFilePath);
    let fileSizeInBytes = stats.size;
    console.log(`Downloaded file size: ${Math.round(fileSizeInBytes / (1024 * 1024) * 100) / 100} MB`);

    if (fileSizeInBytes > OPENAI_MAX_FILE_SIZE_BYTES) {
      console.warn(`Original audio file ${tempFilePath} (${Math.round(fileSizeInBytes / (1024 * 1024) * 100) / 100}MB) exceeds OpenAI's 25MB limit. Attempting compression.`);
      
      const compressedFileName = `compressed_${Date.now()}_${path.basename(new URL(audioUrl).pathname).replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      compressedFilePath = path.join(tempDir, compressedFileName);
      
      const compressionSuccess = await compressAudio(tempFilePath, compressedFilePath, TARGET_AUDIO_TEMPO, TARGET_AUDIO_BITRATE);

      if (compressionSuccess && compressedFilePath && await fs.pathExists(compressedFilePath)) {
        stats = await fs.stat(compressedFilePath);
        const compressedFileSizeInBytes = stats.size;
        console.log(`Compressed file size: ${Math.round(compressedFileSizeInBytes / (1024 * 1024) * 100) / 100} MB`);

        if (compressedFileSizeInBytes > 0 && compressedFileSizeInBytes <= OPENAI_MAX_FILE_SIZE_BYTES) {
          console.log(`Using compressed file ${compressedFilePath} for transcription.`);
          fileToTranscribe = compressedFilePath;
          usingCompressedFile = true;
        } else if (compressedFileSizeInBytes === 0) {
          console.error(`Compressed file ${compressedFilePath} is empty. Transcription cannot proceed.`);
          return "Audio compression resulted in an empty file.";
        } else {
          console.warn(`Compressed file ${compressedFilePath} (${Math.round(compressedFileSizeInBytes / (1024 * 1024) * 100) / 100}MB) still too large. Skipping transcription.`);
          return "Audio file too large to transcribe, even after compression.";
        }
      } else {
        console.error("Audio compression failed or compressed file not found. Skipping transcription.");
        return "Audio compression failed.";
      }
    }

    console.log(`Starting transcription for ${fileToTranscribe}...`);
    const transcription = await OpenAIClient.audio.transcriptions.create({
      file: fs.createReadStream(fileToTranscribe),
      model: "whisper-1",
      response_format: "text",
    });
    console.log("Transcription finished.");

    return transcription as unknown as string;

  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error during audio processing or transcription: ${error.message}`);
    } else {
      console.error('An unknown error occurred during audio processing or transcription.');
    }
    return null; // Or a more specific error message string
  } finally {
    try {
      if (await fs.pathExists(tempFilePath)) {
        await fs.remove(tempFilePath);
        console.log(`Temporary original file ${tempFilePath} deleted.`);
      }
      if (usingCompressedFile && compressedFilePath && await fs.pathExists(compressedFilePath)) {
        await fs.remove(compressedFilePath);
        console.log(`Temporary compressed file ${compressedFilePath} deleted.`);
      }
    } catch (cleanupError) {
      if (cleanupError instanceof Error) {
          console.error(`Error cleaning up temporary file: ${cleanupError.message}`);
      } else {
          console.error('An unknown error occurred during temporary file cleanup, continuing anyway');
      }
    }
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

/**
 * TODO 
 * Link to VectorDB to avoid duplicate record
 * Fetches, transcribes, and returns a specified number of podcast episodes from an RSS feed.
 *
 * @param rssFeedUrl The URL of the podcast's RSS feed.
 * @param count The number of latest episodes to transcribe (defaults to 5).
 * @returns A promise that resolves to an array of transcribed episode data objects.
 */
export async function getTranscribedPodcastEpisodes(podcastsName: string, count: number = 5): Promise<EpisodeData[]> {
  console.log(`Fetching episodes from RSS feed: ${podcastsName}`);
  const rssFeedUrl = await getPodcastRssUrl(podcastsName);
  console.log(`RSS feed URL: ${rssFeedUrl}`);
  if (!rssFeedUrl) {
    console.log(`No RSS feed found for podcast: ${podcastsName}`);
    return [];
  }
  console.log(`RSS feed URL: ${rssFeedUrl}`);
  const allEpisodes = await fetchPodcastEpisodes(rssFeedUrl);

  if (!allEpisodes || allEpisodes.length === 0) {
    console.log("No episodes found or failed to fetch episodes from the RSS feed.");
    return [];
  }

  console.log(`Fetched ${allEpisodes.length} total episodes. Processing the latest ${Math.min(count, allEpisodes.length)}.`);
  const episodesToTranscribe = allEpisodes.slice(0, Math.min(count, allEpisodes.length));
  const transcribedEpisodes: EpisodeData[] = [];

  for (const episode of episodesToTranscribe) {
    let transcriptionText: string | null = 'No audio URL or transcription not attempted.';
    if (episode.audio_url) {
      console.log(`
Transcribing Episode: ${episode.title || 'N/A'} from ${episode.audio_url}`);
      // transcriptionText = await transcribeAudio(episode.audio_url);
      transcriptionText = 'saving time so placeholder';
      episode.transcription = transcriptionText || 'Transcription failed or N/A';
      const tags = await generateTagsForDocument(episode.summary);
      episode.tags = tags;
      await insertAudioTags(tags);

    } else {
      console.log(`Skipping transcription for Episode: ${episode.title || 'N/A'} (no audio URL)`);
      episode.transcription = 'No audio URL provided.';
    }
    transcribedEpisodes.push(episode);
  }

  return transcribedEpisodes;
}

