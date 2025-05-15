import { createClient } from '@/utils/supabase/client';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { ContentDocument } from '@/types/document';


// config & init
const openaiApiKey = process.env.OPENAI_API_KEY;
const supabase = createClient();
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openaiApiKey,
  modelName: 'text-embedding-3-small',
});
const llm = new ChatOpenAI({
  openAIApiKey: openaiApiKey,
  modelName: 'gpt-4.1-mini',
  temperature: 0.2,
});

// config vector store
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: 'documents',
  queryName: 'match_documents'
});

/**
 * Adds an array of ContentDocument objects to the vector store.
 * Embeds the content and stores metadata.
 * @param docs - Array of ContentDocument objects.
 */
export async function embeddingContentDocuments(docs: Array<ContentDocument>, batchSize: number = 100) {
  const documentsToEmbed = docs.map((doc, index) => 
    new Document({
      pageContent: doc.content,
      metadata: {
        title: doc.title || '',
        source_url: doc.source_url || '',
        source_type: doc.source_type || '',
        description: doc.description || '',
        tags: doc.tags || [],
        imageUrl: doc.imageUrl || '',
        chunk_index: index, 
        raw_data: doc.raw_data || null,
        author: doc.author || '',
        upload_time: doc.upload_time || ''
      }
    })
  );

  let successfulEmbeddings = 0;
  for (let i = 0; i < documentsToEmbed.length; i += batchSize) {
    const batch = documentsToEmbed.slice(i, i + batchSize);
    try {
      await vectorStore.addDocuments(batch);
      successfulEmbeddings += batch.length;
      console.log(`Successfully embedded batch ${i / batchSize + 1}, ${batch.length} documents. Total successful: ${successfulEmbeddings}`);
    } catch (error) {
      console.error(`Error embedding batch starting at index ${i}:`, error);
      // Decide if you want to stop on error or continue with next batches
      // For now, we'll log and continue, but you might want to throw the error
      // throw error; 
    }
  }
  
  console.log(`Embedding process completed. Total successfully embedded documents: ${successfulEmbeddings}`);
  return { success: successfulEmbeddings === documentsToEmbed.length, count: successfulEmbeddings };
}

/**
 * return rag result
 */
export async function rag(query: string, options = { limit: 3, tags: undefined as string[] | undefined, source_type: undefined as string | undefined }): Promise<ContentDocument[]> {
  // build filter
  const filter = options.tags?.length ? { tags: options.tags, source_type: options.source_type } : undefined;
  
  // retrieve related docs
  const docs = await vectorStore.similaritySearch(query, options.limit, filter);
  
  // formatting docs as context
  const context = docs.map(doc => {
    const title = doc.metadata.title ? `Title: ${doc.metadata.title}\n` : '';
    return `${title}${doc.pageContent}`;
  }).join('\n\n');
  
  return docs.map(doc => ({
    title: doc.metadata.title,
    description: doc.metadata.description,
    content: doc.pageContent,
    source_url: doc.metadata.source_url,
    source_type: doc.metadata.source_type,
    tags: doc.metadata.tags,
    imageUrl: doc.metadata.imageUrl,
    author: doc.metadata.author,
    upload_time: doc.metadata.upload_time,
  }));
}


  /**
 * return query with rag context result
 */
export async function queryRag(query: string, options = { limit: 3, tags: undefined as string[] | undefined }) {
  // build filter
  const filter = options.tags?.length ? { tags: options.tags } : undefined;
  
  // retrieve related docs
  const docs = await vectorStore.similaritySearch(query, options.limit, filter);
  
  // formatting docs as context
  const context = docs.map(doc => {
    const title = doc.metadata.title ? `Title: ${doc.metadata.title}\n` : '';
    return `${title}${doc.pageContent}`;
  }).join('\n\n');
  
  // build prompt
  const prompt = `
  return the context without any other text:

  ${context}

  Question: ${query}

  Answer:`;

  // generate answer
  const response = await llm.invoke(prompt);
  
  return {
    answer: response.content,
    metadata: docs.map(doc => ({
      title: doc.metadata.title,
      content: doc.pageContent,
      source_url: doc.metadata.source_url,
      source_type: doc.metadata.source_type,
      tags: doc.metadata.tags
    }))
  };
}

