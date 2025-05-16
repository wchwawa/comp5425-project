import { createClient } from '@/utils/supabase/client';
import { generateNewsTags } from '@/services/tag-generator';

async function UpdateTags() {
  const supabase = await createClient();
  const { data: documents } = await supabase
    .from('documents')
    .select()
    .contains('metadata', {source_type: 'news'})
  console.log(documents);
  if (documents) {
    for (let doc of documents) {
        console.log(doc.metadata.raw_data);
        const tickers = doc.metadata.raw_data.ticker_sentiment.map((item: any) => item.ticker).join(',');
        let input = `
        news title:
        ${doc.metadata.title}
        news description: 
        ${doc.content}
        Related Tickers:
         ${tickers}
        `
        console.log(`input: ${input}`);
        doc.metadata.tags = await generateNewsTags(input);
        const { data, error } = await supabase
          .from('documents')
          .update(doc)
          .eq('id', doc.id)
          .select();
    }
  }
}

UpdateTags();
