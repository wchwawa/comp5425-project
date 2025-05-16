import { createClient } from '@/utils/supabase/client';

 async function Podcasts() {
  const supabase = await createClient();
  const { data: documents_transcribed } = await supabase.from("documents_transcribed").select();
  console.log(documents_transcribed?.map((item) => item.metadata.source_url));
}
async function main() {
  await Podcasts();
}
main();