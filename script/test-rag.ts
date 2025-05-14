import { embeddingPodcastDocuments, rag, queryRag } from '@/services/rag';
import { generateTagsForQuery } from '@/services/tag-generator';


async function main() {
  
  // RAG retrieval with tag filtering
  console.log("\n> Test 3: RAG Retrieval with Tag Filtering");
  const query2 = "Any news about Apple or Tesla or China market or US market or Bitcoin or Ethereum?";
  const tags = await generateTagsForQuery(query2);
  console.log(`Query: "${query2}" (Filter tags: ${tags.join(', ')})`);
  
  try {
    const filteredResult = await rag(query2, { 
      limit: 10, 
      tags: tags
    });
    console.log("Retrieved context:");
    // console.log('=========================filtered Result=============================', filteredResult);
    console.log("\nNumber of sources:", filteredResult.length);
    filteredResult.forEach(item => {
      console.log('=========================author=============================', item.author);
      console.log('=========================upload_time=============================', item.upload_time);
    });
    if (filteredResult.length > 0) {
      console.log("First source tags:", filteredResult[0].tags);
    }
  } catch (error) {
    console.error("RAG retrieval with filtering failed:", error);
  }

  console.log("\n=== RAG Test Completed ===");
}

main().catch(error => {
  console.error("Error during test execution:", error);
});
