import { OpenAIClient } from "@/utils/openai/client";
import { ContentDocument } from "@/types/document";
export const generateSummary = async (podcast: ContentDocument, userQuery: string) => {
    const prompt = `
    return the summary of the relationship between the following description of an podcast episode and user's query:
    Requirements:
    - The summary should be concise and to the point
    - The summary should be in the same language as the description
    - The summary should be no more than 100 words
    - The summary should NOT include any other text
    
    Podcast Title:
    ${podcast.title}
    Podcast Description:
    ${podcast.description}
    Podcast Tags:
    ${podcast.tags}


    User Query:
    ${userQuery}
    `;
    const response = await OpenAIClient.responses.create({
        model: "gpt-4.1-mini",
        input: prompt,
    });
    return response.output_text;
}