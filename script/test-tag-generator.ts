import { generateAudioTags, generateTagsForQuery } from "@/services/tag-generator";


async function main() {

  const tags = await generateAudioTags('Any Chinese market news?');
  console.log(tags);
}

main();
