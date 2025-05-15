export namespace AlphaVantage {
  export interface NewsSentimentResponse {
    items: number;
    sentiment_score_definition: string;
    relevance_score_definition: string;
    feed: NewsItem[];
  }

  export interface NewsItem {
    title: string;
    url: string;
    time_published: string; // 格式: YYYYMMDDTHHMMSS
    authors: string[];
    summary: string;
    banner_image: string;
    source: string;
    category_within_source: string;
    source_domain: string;
    topics: Topic[];
    overall_sentiment_score: number;
    overall_sentiment_label: SentimentLabel;
    ticker_sentiment: TickerSentiment[];
  }

  

  export interface Topic {
    topic: string;
    relevance_score: string; // 0-1 范围
  }

  export interface TickerSentiment {
    ticker: string;
    relevance_score: string; // 0-1 范围
    ticker_sentiment_score: string; // 通常为 -1 到 1 范围
    ticker_sentiment_label: SentimentLabel;
  }

  export type SentimentLabel = 
    | 'Bearish' 
    | 'Somewhat-Bearish' 
    | 'Neutral' 
    | 'Somewhat-Bullish' 
    | 'Bullish';
  
  // 用于 API 请求的参数类型
  export interface NewsSentimentParams {
    function: 'NEWS_SENTIMENT';
    tickers: string; // 逗号分隔的股票代码
    topics?: string; // 可选，逗号分隔的主题
    time_from?: string; // 可选，格式: YYYYMMDDTHHMM
    time_to?: string; // 可选，格式: YYYYMMDDTHHMM
    sort?: 'LATEST' | 'RELEVANCE' | 'EARLIEST'; // 可选
    limit?: number; // 可选，默认 50
    apikey: string;
  }
}