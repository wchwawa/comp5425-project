import { rag } from '@/services/rag';
import { generateTagsForQuery } from '@/services/tag-generator';
async function main() {
  
  // RAG retrieval with tag filtering
  console.log("\n> Test 3: RAG Retrieval with Tag Filtering");
  const query2 = "Any news about Apple?";
  const tags = await generateTagsForQuery(query2, "news");
  console.log(`Query: "${query2}" (Filter tags: ${tags.join(', ')})`);
  
  try {
    const filteredResult = await rag(query2, { 
      limit: 5, 
      tags: tags,
      source_type: "news" //or news
    });
    console.log("Retrieved context:");
    // console.log('=========================filtered Result=============================', filteredResult);
    console.log("\nNumber of sources:", filteredResult.length);
    filteredResult.forEach(item => {
      console.log('=========================item=============================', item);
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
