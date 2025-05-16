# 🚀 Project Setup Guide

## 🌐 Live Demo
👉 [Click here to view the live site](https://comp5425-project.vercel.app)
![CleanShot 2025-05-16 at 19 03 07@2x](https://github.com/user-attachments/assets/554f4dc1-74dc-4651-87d4-21fbe432b41a)

## 🛠️ Tech Stack
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![langchain](https://img.shields.io/badge/langchain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)
![ChatGPT](https://img.shields.io/badge/chatGPT-74aa9c?style=for-the-badge&logo=openai&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Azure](https://img.shields.io/badge/azure-%230072C6.svg?style=for-the-badge&logo=microsoftazure&logoColor=white)
![Rss](https://img.shields.io/badge/rss-F88900?style=for-the-badge&logo=rss&logoColor=white)
![Zod](https://img.shields.io/badge/zod-%233068b7.svg?style=for-the-badge&logo=zod&logoColor=white)

## 📦 Dependency Setup

### A. Automatic Setup

```bash
chmod +x setup.sh
./setup.sh
```

### B. Manual Setup

1. Make sure Node.js is installed.
2. In the project root, run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your own API keys.

---

## 🔑 Environment Variables

Refer to `.env.example` and fill in your credentials in `.env.local`.

- 🟢 **Supabase**: [supabase.com](https://supabase.com/)
- 🤖 **OpenAI**: [openai.com](https://platform.openai.com/docs/overview)
- 🗣️ **Azure AI Speech**: [azure.microsoft.com](https://azure.microsoft.com/en-us/products/ai-services/ai-speech)
- 📰 **Alpha Vantage**: [alphavantage.co](https://www.alphavantage.co/support/#api-key)

---

## 🗄️ Database Setup

1. Get familiar with Supabase.
2. Enable the `pgvector` extension:  
   [Supabase vector columns guide](https://supabase.com/docs/guides/ai/vector-columns?queryGroups=database-method&database-method=dashboard)
3. Run the following script in the Supabase SQL editor:

```sql
-- Enable pgvector if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;
-- Drop old function if exists
DROP FUNCTION IF EXISTS match_documents(vector, integer, jsonb);
-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text,
  embedding vector(1536),
  created_at timestamp DEFAULT now(),
  metadata jsonb
);
-- Optional: create index for jsonb metadata tag search
CREATE INDEX IF NOT EXISTS idx_metadata_tags ON documents USING gin ((metadata->'tags'));
-- Create match_documents function
CREATE OR REPLACE FUNCTION match_documents (
  query_embedding vector(1536),
  match_count int,
  filter jsonb DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    docs.id,
    docs.metadata->>'title' AS title,
    docs.content,
    docs.metadata,
    1 - (docs.embedding <=> query_embedding) AS similarity
  FROM documents AS docs
  WHERE
    (
      ((filter - 'tags') = '{}'::jsonb) OR (docs.metadata @> (filter - 'tags'))
    )
    AND
    (
      NOT (filter ? 'tags') OR 
      (
        (docs.metadata ? 'tags') AND
        (jsonb_typeof(docs.metadata->'tags') = 'array') AND
        (docs.metadata->'tags' ?| ARRAY(SELECT jsonb_array_elements_text(filter->'tags')))
      )
    )
  ORDER BY docs.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

---

## 📥 Data Retrieval & Indexing

- Configure the news topics you want to fetch in `script/process-indexing.ts`.
- For valid parameters, see: [Alpha Vantage News Sentiment docs](https://www.alphavantage.co/documentation/#news-sentiment)
- Podcast parameters (e.g., account, topic) are preset and cannot be changed.
- To fetch and index data, run:
  ```bash
  npm run test ./script/process-indexing.ts
  ```

---

## 🖥️ Run the Server

```bash
npm run dev
```

---

## 🗃️ Database and Types

- Check `types/supabase.ts` for the current schema types.
- After changing the database schema, regenerate types with:
  ```bash
  npm run supabase:generate-types
  ```

---

## 🏗️ System Structure

![diagram](./assets/comp5425-diagram.png)
