import { AlphaVantage } from '../types/alphavantage';

/**
 * 获取特定主题的新闻情绪数据
 */
export async function getNewsSentiment(
  topics?: string, // Changed from ticker, topics is now a single string
  limit: number = 1000,
): Promise<AlphaVantage.NewsSentimentResponse> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY as string;
  
  if (!apiKey) {
    throw new Error('Alpha Vantage API密钥未设置。请在环境变量中设置ALPHA_VANTAGE_API_KEY。');
  }
  
  // topics string is used directly as per Alpha Vantage documentation for a single or comma-separated topics
  // No need to format topics if it's already a correctly formatted string.

  const params: Partial<AlphaVantage.NewsSentimentParams> = {
    function: 'NEWS_SENTIMENT',
    topics: topics, // Use the topics string directly
    // tickers?: ticker, // not used for index news data
    limit,
    apikey: apiKey
  };
  
  const queryString = Object.entries(params)
    .map(([key, value]) => `${key}=${value}`)
    .join('&');
  
  console.log("queryString for news sentiment api", queryString);
    
  const url = `https://www.alphavantage.co/query?${queryString}`;

  console.log("url for news sentiment api", url);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 }, // 缓存1小时，减少API调用次数
    });
    
    if (!response.ok) {
      // Try to get more detailed error from Alpha Vantage if possible
      let errorMessage = `Alpha Vantage API错误: ${response.status}`;
      try {
        const errorBody = await response.json();
        errorMessage += ` - ${errorBody.Information || errorBody.Note || JSON.stringify(errorBody)}`;
      } catch (e) {
        // Ignore if an error occurs while parsing error body
      }
      throw new Error(errorMessage);
    }
    
    return response.json() as Promise<AlphaVantage.NewsSentimentResponse>;
  } catch (error) {
    console.error('获取新闻情绪数据失败:', error);
    throw error;
  }
}

/**
 * 将Alpha Vantage的日期格式转换为JavaScript Date对象
 */
export function formatAlphaVantageDate(dateString: string): Date {
  // 从 "YYYYMMDDTHHMMSS" 解析
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1; // 月份从0开始
  const day = parseInt(dateString.substring(6, 8));
  const hour = parseInt(dateString.substring(9, 11));
  const minute = parseInt(dateString.substring(11, 13));
  const second = parseInt(dateString.substring(13, 15) || '00');
  
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * 将Alpha Vantage的日期格式转换为可读字符串
 */
export function formatAlphaVantageDateString(dateString: string): string {
  const date = formatAlphaVantageDate(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * 处理新闻数据，提取重要信息并格式化日期
 */
export function processNewsData(data: AlphaVantage.NewsSentimentResponse) {
  return data.feed.map(item => ({
    title: item.title,
    date: formatAlphaVantageDateString(item.time_published),
    sentiment: item.overall_sentiment_label,
    score: item.overall_sentiment_score,
    url: item.url,
    summary: item.summary,
    source: item.source,
    image: item.banner_image
  }));
} 