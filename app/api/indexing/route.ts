import { NextRequest, NextResponse } from "next/server";
import { indexPodcastEpisodes } from "@/services/indexing";

// handle POST request
export async function POST(request: NextRequest) {
  try {
    await indexPodcastEpisodes();
    return NextResponse.json({ success: true, message: "indexing complete" })
  } catch (error) {
    console.error("indexing failed :", error);
    return NextResponse.json(
      { success: false, message: "indexing failed", error: String(error) },
      { status: 500 }
    );
  }
} 