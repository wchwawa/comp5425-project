import { OpenAI } from 'openai';

export const OpenAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});