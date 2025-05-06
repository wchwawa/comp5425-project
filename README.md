**Prerequisites**
run `npm install` after pull

**ENV**
see .env.example
use our own llm api key, better not to share cuz it will be banned if accidentally published

**run script**
npm run script <script-path>

**run next**
npm run dev

**db and tables**
see types/supabase.ts, if you just updated the db schema, run `npm run supabase:generate-types` to update the types

**ai**
langchain + supabase pg vector + gpt4.1(or gpt-4o) + openai-embedding-3-large (3072)
