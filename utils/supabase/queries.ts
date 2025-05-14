import { createClient } from "./client";

export async function getTags() {
  const supabase = createClient();
  const { data, error } = await supabase.from('documents_transcribed').select('*');
  if (error) {
    console.error('Error fetching tags from documents:', error);
    return null;
  }
  return data;
}

const AUDIO_TYPE = 'audio';
const NEWS_TYPE = 'news'; // News type constant

/**
 * Retrieves the current list of tags for the 'audio' type from tags_collection.
 * @returns The record containing audio tags, or null if not found or an error occurs.
 */
export async function getAudioTags() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tags_collection')
    .select('id, type, tags') // Select relevant columns
    .eq('type', AUDIO_TYPE)
    .maybeSingle(); // Expects one row or null

  if (error && error.code !== 'PGRST116') { // PGRST116: row not found, which is acceptable
    console.error(`Error fetching tags for type '${AUDIO_TYPE}':`, error);
    return null;
  }
  return data; // Returns the row data (which includes tags) or null if not found
}

/**
 * Retrieves the current list of tags for the 'news' type from tags_collection.
 * @returns The record containing news tags, or null if not found or an error occurs.
 */
export async function getNewsTags() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tags_collection')
    .select('id, type, tags') // Select relevant columns
    .eq('type', NEWS_TYPE)
    .maybeSingle(); // Expects one row or null

  if (error && error.code !== 'PGRST116') { // PGRST116: row not found, which is acceptable
    console.error(`Error fetching tags for type '${NEWS_TYPE}':`, error);
    return null;
  }
  return data; // Returns the row data (which includes tags) or null if not found
}

/**
 * Appends new tags to the 'audio' type row in the 'tags_collection' table,
 * ensuring the entire array of tags in that row remains unique and sorted.
 * If the 'audio' type row does not exist, it will be created.
 * @param newTags An array of strings representing the new tags to add.
 * @returns The updated record from Supabase containing all unique audio tags, or null if an error occurs.
 */
export async function insertAudioTags(newTags: string[]) {
  if (!newTags || !Array.isArray(newTags) || newTags.length === 0) {
    console.log("No new tags provided. Fetching current audio tags.");
    return getAudioTags(); // Return current audio tags if no new tags are provided
  }

  const supabase = createClient();

  // 1. Fetch the current list of tags for the 'audio' type.
  let existingTags: string[] = [];
  const currentAudioData = await getAudioTags();

  if (currentAudioData && currentAudioData.tags) {
    existingTags = currentAudioData.tags;
  }

  // 2. Combine existing tags with new tags, remove duplicates, and sort.
  const combinedTags = [...existingTags, ...newTags];
  const updatedUniqueSortedTags = Array.from(new Set(combinedTags)).sort();

  // 3. Update the data in the tags_collection table.
  // Since we can't rely on onConflict with 'type', we'll use an update where type='audio'
  // We know from getAudioTags that the audio row exists with id=1
  const { data: updatedData, error: updateError } = await supabase
    .from('tags_collection')
    .update({ tags: updatedUniqueSortedTags })
    .eq('type', AUDIO_TYPE)
    .select();

  if (updateError) {
    console.error(`Error updating tags for type '${AUDIO_TYPE}':`, updateError);
    return null;
  }

  console.log(`Tags for type '${AUDIO_TYPE}' updated. Total unique tags: ${updatedUniqueSortedTags.length}`);
  return updatedData.length > 0 ? updatedData[0] : null;
}

/**
 * Appends new tags to the 'news' type row in the 'tags_collection' table,
 * ensuring the entire array of tags in that row remains unique and sorted.
 * @param newTags An array of strings representing the new tags to add.
 * @returns The updated record from Supabase containing all unique news tags, or null if an error occurs.
 */
export async function insertNewsTags(newTags: string[]) {
  if (!newTags || !Array.isArray(newTags) || newTags.length === 0) {
    console.log("No new tags provided. Fetching current news tags.");
    return getNewsTags(); // Return current news tags if no new tags are provided
  }

  const supabase = createClient();

  // 1. Fetch the current list of tags for the 'news' type.
  let existingTags: string[] = [];
  const currentNewsData = await getNewsTags();

  if (currentNewsData && currentNewsData.tags) {
    existingTags = currentNewsData.tags;
  }

  // 2. Combine existing tags with new tags, remove duplicates, and sort.
  const combinedTags = [...existingTags, ...newTags];
  const updatedUniqueSortedTags = Array.from(new Set(combinedTags)).sort();

  // 3. Update the data in the tags_collection table.
  const { data: updatedData, error: updateError } = await supabase
    .from('tags_collection')
    .update({ tags: updatedUniqueSortedTags })
    .eq('type', NEWS_TYPE)
    .select();

  if (updateError) {
    console.error(`Error updating tags for type '${NEWS_TYPE}':`, updateError);
    return null;
  }

  console.log(`Tags for type '${NEWS_TYPE}' updated. Total unique tags: ${updatedUniqueSortedTags.length}`);
  return updatedData.length > 0 ? updatedData[0] : null;
}