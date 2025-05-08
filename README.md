
```markdown
# Project Setup Guide

## Prerequisites

After cloning the repo, install dependencies:

```bash
npm install
```

## Environment Variables

See `.env.example` for reference:

- **LLM API Key**: Use your own API key. Do not share it - public exposure may lead to the key being banned
- **Supabase Credentials**: Retrieve from the Supabase dashboard

## Running Scripts (for Testing)

You can run custom scripts using:

```bash
npm run script <script-path>
```

Write your test files in the `./script` directory.

## Running the Development Server

```bash
npm run dev
```

## Database and Types

- Check `types/supabase.ts` for current schema types
- After making changes to the database schema, regenerate types with:

```bash
npm run supabase:generate-types
```

## Tech Stack

- LangChain
- Supabase PG Vector
- GPT-4.1 or GPT-4o
- openai-embedding-3-small (1536 dimensions)
```
