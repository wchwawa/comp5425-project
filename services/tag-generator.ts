import { ChatOpenAI } from "@langchain/openai"
import {z} from "zod"
import { getAudioTags } from "@/utils/supabase/queries"

/**
 * 
 * @param podcastContent 
 * @returns  
 * @description generate tags for podcast content, used for filtering docs
 */
export async function generateTagsForDocument(podcastContent: string | undefined) : Promise<string[]> {
  const schema = z.object({
    tags: z.array(z.string()),
  });
  const llm = new ChatOpenAI({
    model: "gpt-4.1",
    temperature: 0,
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


export async function generateTagsForQuery(query: string) : Promise<string[]> {
  const schema = z.object({
    tags: z.array(z.string()),
  });

  if (!query || typeof query !== 'string' || query.trim() === '') {
    console.log('Query is undefined, empty, or not a string');
    return [];
  }

  const audioTagData = await getAudioTags();

  const existingTagsForPrompt = audioTagData?.tags?.length 
      ? audioTagData.tags.join(', ') 
      : 'No existing tags available to select from.';

  const llm = new ChatOpenAI({
    model: "gpt-4.1",
    temperature: 0,
  });

  const runnable = llm.withStructuredOutput(schema);
  const prompt = `Your task is to perform EXACT MATCHING between a user query and a list of predefined tags.

CRITICAL INSTRUCTIONS:
1. You must ONLY return tags that appear EXACTLY as they are written in the "Existing Tags" list.
2. DO NOT modify any tag in any way:
   - DO NOT add stock symbols like (AAPL) or (TSLA)
   - DO NOT change capitalization
   - DO NOT add or remove words
   - DO NOT create new tags even if they seem relevant
   - DO NOT combine or split existing tags

3. Matching Process:
   a. Read the user query carefully
   b. Look through the list of existing tags
   c. Select ONLY the tags that directly relate to concepts mentioned in the query
   d. Return the EXACT tags as they appear in the list - no variations allowed

4. Output Format:
   - Return only an array of matching tags
   - If no exact matches exist, return an empty array
   - Do not explain your reasoning or add commentary

EXAMPLE:
User Query: "I'm looking for news about Apple and Tesla stock prices"
Existing Tags: ["Apple", "Microsoft", "Tesla", "Stock Market", "Revenue"]
Correct Response: ["Apple", "Tesla", "Stock Market"]
INCORRECT Response: ["Apple (AAPL)", "Tesla (TSLA)", "Stock Prices"]  ← NEVER DO THIS

User Query:
---QUERY_START---
${query}
---QUERY_END---

Existing Tags (ONLY select from this exact list):
---EXISTING_TAGS_START---
${existingTagsForPrompt}
---EXISTING_TAGS_END---

Remember: ONLY return tags that appear EXACTLY AS WRITTEN above. Any deviation from the exact tag text is STRICTLY FORBIDDEN.`;
  
  try {
    const result = await runnable.invoke(prompt);
    return Array.isArray(result.tags) ? result.tags : [];
  } catch (error) {
    console.error('Error generating tags for query with OpenAI:', error);
    return [];
  }
}


