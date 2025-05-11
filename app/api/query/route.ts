import { generateTagsForQuery } from "@/services/tag-generator";
import { NextRequest, NextResponse } from "next/server";
import { rag, queryRag } from "@/services/rag";
import { generateSummary } from "@/services/summary-generator";
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { query } = await request.json();
  // generate tags for query
  const tags = await generateTagsForQuery(query);
  
  // retrieve podcast documents, filter by tags first, then retrieve the top-2 relevant podcasts by rag
  const matchedPodcastDocuments = await rag(query, { tags, limit: 2 });

  // generate summary for each podcast
  for (const podcast of matchedPodcastDocuments) {
    const summary = await generateSummary(podcast, query);
    podcast.aiSummary = summary ?? undefined;
  }
  
  return NextResponse.json({ podcastDocuments: matchedPodcastDocuments });
}

