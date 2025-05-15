import { NextRequest, NextResponse } from "next/server";
import { generateTagsForQuery } from "@/services/tag-generator";
import { rag } from "@/services/rag";
import { ContentDocument } from "@/types/document";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { query } = await request.json();
  const tags = await generateTagsForQuery(query, "news");
  console.log("Fetching news: get tags for query", tags)
  const news: ContentDocument[] = await rag(query, { tags, limit: 5, source_type: "news" });
  console.log("Fetching news: get news for query", news)
  return NextResponse.json({ news: news });
}

