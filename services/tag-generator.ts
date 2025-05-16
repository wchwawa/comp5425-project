import { ChatOpenAI } from "@langchain/openai"
import {z} from "zod"
import { getAudioTags, getNewsTags } from "@/utils/supabase/queries"

/**
 * 
 * @param podcastContent 
 * @returns  
 * @description generate tags for podcast content, used for filtering docs
 */
export async function generateAudioTags(podcastContent: string | undefined) : Promise<string[]> {
  const schema = z.object({
    tags: z.array(z.string()),
  });
  const llm = new ChatOpenAI({
    model: "gpt-4.1-nano",
    temperature: 0.5,
  });

  const runnable = llm.withStructuredOutput(schema);
  if (!podcastContent || typeof podcastContent !== 'string' || podcastContent.trim() === '') {
    console.log('podcast content(summary) is undefined, empty, or not a string');
    return [];
  } else {
    const prompt = `Your task is to extract specific and relevant tags from the provided text.
Focus exclusively on stock market and finance-related concepts.

Instructions:
1.  **Relevance is key**: Only extract tags directly supported by the text.
2.  **Specificity**: Prefer specific entities (e.g., company names like "Apple", "Tesla"; stock tickers like "NVDA"), financial instruments (e.g., "ETFs", "bonds"), key economic indicators (e.g., "inflation", "interest rates"), notable figures (e.g., "Warren Buffett"), and precise market concepts (e.g., "quantitative easing", "initial public offering"). Avoid overly broad terms unless they are central to the text.
3.  **Quantity**: Aim for 15 to 30 high-quality tags. If the text doesn't contain enough relevant concepts for 15 tags, provide as many relevant tags as you can find. Do not invent or force tags to meet the minimum.
4.  **Format**: Tags should be concise, typically 1-3 words.

Example Tags:
-   American stock market
-   Australian stock market
-   Apple (AAPL)
-   Tesla (TSLA)
-   Nvidia (NVDA)
-   Economics
-   Real Estate
-   Magnificent Seven
-   Warren Buffett
-   Inflation
-   Interest Rates
-   Stock Portfolio
-   Investment Strategy
-   Chinese Stock Market
-   Recession
-   Bull Market
-   Bear Market
-   Stock Market
-   Stock Market Crash
-   Stock Market Rally

Text to process:
---TEXT_START---
${podcastContent}
---TEXT_END---
`;
    try {
      const result = await runnable.invoke(prompt);
      return Array.isArray(result.tags) ? result.tags : [];
    } catch (error) {
      console.error('Error generating tags with OpenAI:', error);
      return [];
    }
  }
}

/**
 * Generates a limited number of specific and relevant tags for news content,
 * focusing on stock market and finance-related concepts.
 * Aims for fewer than 5 high-quality tags.
 *
 * @param newsContent The content of the news article.
 * @returns A promise that resolves to an array of strings, representing the generated tags.
 */
export async function generateNewsTags(newsContent: string | undefined): Promise<string[]> {
  const schema = z.object({
    tags: z.array(z.string()),
  });
  const llm = new ChatOpenAI({
    model: "gpt-4.1-nano",
    temperature: 0.5,
  });

  const runnable = llm.withStructuredOutput(schema);
  if (!newsContent || typeof newsContent !== 'string' || newsContent.trim() === '') {
    console.log('News content is undefined, empty, or not a string');
    return [];
  }

  const prompt = `Your task is to extract a few highly specific and relevant tags from the provided news text.
Focus exclusively on stock market and finance-related concepts.

Instructions:
1.  **Relevance is key**: Only extract tags directly and clearly supported by the text.
2.  **Specificity**: Prefer specific entities (e.g., company names like "Apple", "Tesla"; stock tickers like "NVDA"), financial instruments (e.g., "ETFs", "bonds"), key economic indicators (e.g., "inflation", "interest rates"), and precise market concepts. Avoid overly broad terms.
3.  **Quantity**: Aim for **at least 5 high-quality tags**. Brevity and impact are important. If the text doesn't contain enough relevant concepts for even 1-2 tags, provide as many as you can find. Do not invent or force tags.
4.  **Format**: Tags should be concise, typically 1-3 words.

Example Tags (illustrative, adapt to content):
-   Nvidia
-   NVDA
-   American Stock Market
-   Medicine Market
-   
-   Interest Rate Hike
-   Tesla Earnings
-   IPO Market

Text to process:
---TEXT_START---
${newsContent}
---TEXT_END---
`;

  try {
    const result = await runnable.invoke(prompt);
    // Ensure the number of tags does not exceed 5, though the prompt already guides this.
    const limitedTags = Array.isArray(result.tags) ? result.tags.slice(0, 5) : [];
    return limitedTags;
  } catch (error) {
    console.error('Error generating news tags with OpenAI:', error);
    return [];
  }
}


export async function generateTagsForQuery(query: string, source_type: string) : Promise<string[]> {
  const schema = z.object({
    tags: z.array(z.string()),
  });

  if (!query || typeof query !== 'string' || query.trim() === '') {
    console.log('Query is undefined, empty, or not a string');
    return [];
  }

  let existingTagsForPrompt: string;

  if (source_type === "news") {
    const newsTagData = await getNewsTags();
    existingTagsForPrompt = newsTagData?.tags?.length 
      ? newsTagData.tags.join(', ') 
      : 'No existing tags available to select from.';
  } else if (source_type === "podcast") {
    const audioTagData = await getAudioTags();
    existingTagsForPrompt = audioTagData?.tags?.length 
      ? audioTagData.tags.join(', ') 
      : 'No existing tags available to select from.';
  } else {
    console.warn(`Unknown source_type: "${source_type}". Using generic prompt instructions.`);
    existingTagsForPrompt = 'No specific pre-existing tags available for this source type. Please identify relevant financial and stock market tags from the query based on general knowledge.';
  }
  
  const llm = new ChatOpenAI({
    model: "gpt-4.1",
    temperature: 0.8,
  });

  const runnable = llm.withStructuredOutput(schema);
  const prompt = `Your task is to perform FUZZY MATCHING between a user query and a list of predefined tags. The goal is to identify existing tags that are semantically similar or closely related to the concepts mentioned in the user query, even if the wording isn't identical.

CRITICAL INSTRUCTIONS:
Return Relevant Existing Tags: You should return tags from the "Existing Tags" list that have a strong conceptual overlap with the user query. The match doesn't need to be exact in wording.

Guidelines for Tag Selection:
Prioritize Semantic Similarity: Focus on the meaning and context. For example, "info on AAPL stock" could fuzzily match an existing tag like "Apple Inc. Share Price".
Case Insensitivity: Treat "apple", "Apple", and "APPLE" as potentially related to the same concept if an existing tag reflects that.
Minor Wording Variations: Allow for variations like singular/plural, synonyms, or slightly different phrasing (e.g., "market performance" vs. "Stock Market Trends").
DO NOT Invent New Tags: Only select tags from the provided "Existing Tags" list. Do not create new tags, even if they seem highly relevant.
DO NOT Add Extraneous Information: Do not append stock symbols (e.g., (AAPL)) or other details to the tags unless they are part of the existing tag itself.
DO NOT Combine or Split Existing Tags: Return the tags as they appear in the list.

Matching Process:
a.  Read the user query carefully to understand the core concepts and intent.
b.  Review the list of "Existing Tags."
c.  Select tags from the list that are semantically similar or closely related to the concepts mentioned in the query. Consider synonyms, related terms, and contextual relevance.
d.  Return the selected tags as they appear in the "Existing Tags" list.

Output Format:
You should return at least 10 tags for the query, ranking them by relevance to the query.
Return only an array of matching tags from the "Existing Tags" list.
If no tags are found to be sufficiently similar or relevant, return an empty array.
Do not explain your reasoning or add commentary.

EXAMPLE:
User Query: "I'd like to know about the financial health of Apple and general stock market movements."
Existing Tags: ["Apple Inc. Financials", "Microsoft Corp.", "Tesla Motors", "Overall Market Performance", "Company Revenue", "Tech Sector News"]
Correct Response: ["Apple Inc. Financials", "Overall Market Performance"]
Explanation for understanding (do not include in your actual output):
* "Apple Inc. Financials" is a good fuzzy match for "financial health of Apple."
* "Overall Market Performance" is a good fuzzy match for "general stock market movements."
* Other tags are not as directly relevant or similar.

User Query:
---QUERY_START---
${query}
---QUERY_END---

Existing Tags (ONLY select from this list based on fuzzy matching):
---EXISTING_TAGS_START---
${existingTagsForPrompt}
---EXISTING_TAGS_END---

Remember: Your goal is to find the most relevant tags from the existing list using fuzzy matching principles. Do not return tags that are not in the list.`;
  
  try {
    const result = await runnable.invoke(prompt);
    console.log(result.tags);
    return Array.isArray(result.tags) ? result.tags : [];
  } catch (error) {
    console.error('Error generating tags for query with OpenAI:', error);
    return [];
  }
}


