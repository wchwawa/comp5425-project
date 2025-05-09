import { createClient } from '@/utils/supabase/client';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { Document } from '@langchain/core/documents';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';


// config & init
const openaiApiKey = process.env.OPENAI_API_KEY;
const supabase = createClient();
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: openaiApiKey,
  modelName: 'text-embedding-3-small',
});
const llm = new ChatOpenAI({
  openAIApiKey: openaiApiKey,
  modelName: 'gpt-4o',
  temperature: 0.2,
});

// config vector store
const vectorStore = new SupabaseVectorStore(embeddings, {
  client: supabase,
  tableName: 'documents',
  queryName: 'match_documents'
});

/**
 * add docs to vector store
 * @param docs - array of documents is an array of objects with the following properties:
 * {
 *   content: string,
 *   title?: string,
 *   source_url?: string,
 *   source_type?: string,
 *   tags?: string[],
 *   raw_data?: any,
 *   description?: string
 * }
 * @description - this fuction will send the docs to supabase vector store, 
 * embeding the content to emebdding column, and the wrap rest of the fields to json and save to metadata column.
 */
export async function addDocuments(docs: Array<{
  content: string,
  title?: string,
  source_url?: string,
  source_type?: string,
  tags?: string[],
  raw_data?: any,
  description?: string,
  
}>) {
  const documents = docs.map((doc, index) => 
    new Document({
      pageContent: doc.content,
      metadata: {
        title: doc.title || '',
        source_url: doc.source_url || '',
        source_type: doc.source_type || '',
        description: doc.description || '',
        tags: doc.tags || [],
        chunk_index: index,
        raw_data: doc.raw_data || null
      }
    })
  );
  
  await vectorStore.addDocuments(documents);
  return { success: true, count: documents.length };
}

/**
 * return rag result
 */
export async function RAG(query: string, options = { limit: 3, tags: undefined as string[] | undefined }) {
  // build filter
  const filter = options.tags?.length ? { tags: options.tags } : undefined;
  
  // retrieve related docs
  const docs = await vectorStore.similaritySearch(query, options.limit, filter);
  
  // formatting docs as context
  const context = docs.map(doc => {
    const title = doc.metadata.title ? `Title: ${doc.metadata.title}\n` : '';
    return `${title}${doc.pageContent}`;
  }).join('\n\n');
  
  return {
    context,
    metadata: docs.map(doc => ({
      title: doc.metadata.title,
      description: doc.metadata.description,
      content: doc.pageContent,
      source_url: doc.metadata.source_url,
      source_type: doc.metadata.source_type,
      tags: doc.metadata.tags,
    }))
  };
}


  /**
 * return query with rag context result
 */
export async function queryRAG(query: string, options = { limit: 3, tags: undefined as string[] | undefined }) {
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

