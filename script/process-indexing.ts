import { indexNewsData } from "@/services/indexing";
const topics = [
  ''
];
const main = async () => {
  await indexNewsData(50, topics);
}

main();