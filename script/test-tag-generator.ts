import { generateTagsForDocument, generateTagsForQuery } from "@/services/tag-generator";


async function main() {
  // const tags = await generateTagsForDocument(podcastContent);
  // console.log(tags);
  // const isTagsArray = Array.isArray(tags);
  // console.log('is outTagsArray', isTagsArray);
  const tags = await generateTagsForQuery('Any Chinese market news?');
  console.log(tags);
}

main();
