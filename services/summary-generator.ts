import { OpenAIClient } from "@/utils/openai/client";
import { ContentDocument } from "@/types/document";
export const generateSummary = async (podcast: ContentDocument, userQuery: string) => {
    const prompt = `
    return the summary of the relationship between the following description of an podcast episode and user's query:
    Requirements:
    - The summary should be concise and to the point
    - The summary should be in the same language as the description
    - The summary should be concise and no more than 60 words
    - The summary should NOT include any other text
    - YOU MUST RESPOND IN ENGLISH
    - If the podcast is not directly related to the user's query, describe how the contents are potentially related to the user's query
    
    Podcast Title:
    ${podcast.title}
    Podcast Description:
    ${podcast.description}
    Podcast Tags:
    ${podcast.tags}
    Podcast Content:
    ${podcast.content}


    User Query:
    ${userQuery}
    `;
    const response = await OpenAIClient.responses.create({
        model: "gpt-4.1-mini",
        input: prompt,
    });
    return response.output_text;
}