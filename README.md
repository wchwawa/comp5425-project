**Prerequisites**
run `npm install` after pull

**ENV**
see .env.example
- use our own llm api key, better not to share cuz it will be banned if accidentally published
- find supabase security in its dashboard

**script 跑测试**
-run: npm run script <script-path>
-write you own test file in ./script

**run server**
npm run dev

**db and tables**
see types/supabase.ts, if you just updated the db schema, run `npm run supabase:generate-types` to update the types

**tech stack**
langchain + supabase pg vector + gpt4.1(or gpt-4o) + openai-embedding-3-small (1536)
