import { createClient } from '@/utils/supabase/client';
import { generateTagsForDocument } from '@/services/tag-generator';
async function GetExistingPodcasts() {
  const supabase = await createClient();
  const { data: documents_transcribed } = await supabase
    .from('documents_transcribed')
    .select();
  if (documents_transcribed) {
    for (let doc of documents_transcribed) {

        doc.metadata.tags = await generateTagsForDocument(doc.content);
        const { data, error } = await supabase
          .from('documents_transcribed')
          .update(doc)
          .eq('id', doc.id)
          .select();
    }
  }
}

GetExistingPodcasts();
