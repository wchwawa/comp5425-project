import { addDocuments, RAG, queryRAG } from '@/services/ai';


async function main() {
  console.log("=== RAG Test Started ===");
  
  // Test 1: Add documents
  console.log("\n> Test 1: Adding Documents");
  const testDocs = [
    {
      content: "Python is a high-level programming language known for its concise syntax and powerful libraries. It is widely used in web development, data science, and AI.",
      title: "Introduction to Python",
      source_type: "article",
      tags: ["programming", "python"],
      raw_data: { 
        version: "3.11",
        creator: "Guido van Rossum"
      }
    },
    {
      content: "JavaScript is the primary programming language for the web, used to create interactive webpages. It can run in browsers as well as on servers through Node.js.",
      title: "Introduction to JavaScript",
      source_type: "article",
      tags: ["programming", "javascript"],
      raw_data: {
        version: "ES2022",
        environments: ["browser", "node"]
      }
    },
    {
      content: "React is a JavaScript library for building user interfaces. Developed by Facebook, it's widely used for creating single-page applications.",
      title: "React Framework Introduction",
      source_type: "tutorial",
      tags: ["frontend", "javascript", "react"],
      raw_data: {
        version: "18.0",
        type: "library"
      }
    }
  ];
  
  try {
    const result = await addDocuments(testDocs);
    console.log(`Documents added successfully, total: ${result.count}`);
  } catch (error) {
    console.error("Failed to add documents:", error);
    return;
  }

  // Wait for embeddings to process
  console.log("Waiting for index update (3 seconds)...");
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Basic RAG retrieval
  console.log("\n> Test 2: Basic RAG Retrieval");
  const query1 = "What types of development is Python suitable for?";
  console.log(`Query: "${query1}"`);
  
  try {
    const ragResult = await RAG(query1);
    console.log("Retrieved context:");
    console.log(ragResult.context);
    console.log("\nNumber of sources:", ragResult.sources.length);
    console.log("First source:", ragResult.sources[0].title);
  } catch (error) {
    console.error("RAG retrieval failed:", error);
  }
  
  // Test 3: RAG retrieval with tag filtering
  console.log("\n> Test 3: RAG Retrieval with Tag Filtering");
  const query2 = "What technologies are used in frontend development?";
  const filterTags = ["frontend"];
  console.log(`Query: "${query2}" (Filter tags: ${filterTags.join(', ')})`);
  
  try {
    const filteredResult = await RAG(query2, { 
      limit: 2, 
      tags: filterTags
    });
    console.log("Retrieved context:");
    console.log(filteredResult.context);
    console.log("\nNumber of sources:", filteredResult.sources.length);
    if (filteredResult.sources.length > 0) {
      console.log("First source tags:", filteredResult.sources[0].tags);
    }
  } catch (error) {
    console.error("RAG retrieval with filtering failed:", error);
  }
  
  // Test 4: Complete RAG query (with AI answer)
  console.log("\n> Test 4: Complete RAG Query (with AI answer)");
  const query3 = "Compare the main differences between Python and JavaScript";
  console.log(`Query: "${query3}"`);
  
  try {
    const queryResult = await queryRAG(query3);
    console.log("AI Answer:");
    console.log(queryResult.answer);
    console.log("\nNumber of sources:", queryResult.sources.length);
  } catch (error) {
    console.error("Complete RAG query failed:", error);
  }


  
  console.log("\n=== RAG Test Completed ===");
}

main().catch(error => {
  console.error("Error during test execution:", error);
});
