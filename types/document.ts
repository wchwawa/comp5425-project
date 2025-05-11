export interface ContentDocument {
  content: string,
  title?: string,
  source_url?: string,
  upload_time?: string,
  author?: string,
  source_type?: string,
  tags?: string[],
  raw_data?: any,
  description?: string,
  imageUrl?: string,
  aiSummary?: string,
}