import React from 'react';
import { AlphaVantage } from '@/types/alphavantage';

// Define the structure of a processed news item based on processNewsData function
// We will use the NewsItem from AlphaVantage directly for now and refine later if needed
// or create a more specific type if processNewsData significantly alters the structure.
export interface ProcessedNewsItem {
  title: string;
  date: string; // Formatted date string
  sentiment: AlphaVantage.SentimentLabel;
  score: number;
  url: string;
  summary: string;
  source: string;
  image?: string; // Optional image
}

interface NewsDisplayProps {
  newsItems: ProcessedNewsItem[];
  isLoading: boolean;
  error?: string | null;
}

export const NewsDisplay: React.FC<NewsDisplayProps> = ({
  newsItems,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <div className="w-full backdrop-blur-md bg-black/30 p-4 rounded-xl border border-gray-800/50 shadow-md mt-6">
        <h3 className="text-lg font-medium text-gray-200 mb-3">
          News & Sentiments
        </h3>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-blue-500 animate-spin"></div>
            <div className="absolute inset-1 rounded-full border-2 border-purple-500 animate-pulse"></div>
          </div>
          <p className="mt-3 text-gray-300 font-medium">
            Fetching latest news...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full backdrop-blur-md bg-black/30 p-4 rounded-xl border border-gray-800/50 shadow-md mt-6">
        <h3 className="text-lg font-medium text-gray-200 mb-3">
          News & Sentiments
        </h3>
        <div className="py-3 px-4 bg-red-900/40 border border-red-700/60 text-red-200 rounded-lg backdrop-blur-sm">
          <p>Error loading news: {error}</p>
        </div>
      </div>
    );
  }

  if (!newsItems || newsItems.length === 0) {
    return (
      <div className="w-full backdrop-blur-md bg-black/30 p-4 rounded-xl border border-gray-800/50 shadow-md mt-6">
        <h3 className="text-lg font-medium text-gray-200 mb-3">
          News & Sentiments
        </h3>
        <p className="text-gray-400 text-center py-4">
          No news articles found for your query.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full backdrop-blur-md bg-black/30 p-4 rounded-xl border border-gray-800/50 shadow-md mt-6">
      <h3 className="text-lg font-medium text-gray-200 mb-4">
        News & Sentiments
      </h3>
      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
        {newsItems.map((item, index) => (
          <div
            key={index}
            className="bg-black/40 p-4 rounded-lg border border-gray-700/50 hover:border-indigo-500/70 transition-colors duration-200"
          >
            {item.image && (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-40 object-cover rounded-md mb-3"
                onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
              />
            )}
            <h4 className="text-md font-semibold text-indigo-400 hover:text-indigo-300 mb-1">
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                {item.title}
              </a>
            </h4>
            <p className="text-xs text-gray-400 mb-1">
              {item.source} - <span className="italic">{item.date}</span>
            </p>
            <p className="text-sm text-gray-300 mb-2 leading-relaxed">
              {item.summary}
            </p>
            <div className="flex items-center text-xs">
              <span
                className={`px-2 py-0.5 rounded-full text-white 
                  ${
                    item.sentiment === 'Bullish' ||
                    item.sentiment === 'Somewhat-Bullish'
                      ? 'bg-green-600/70'
                      : item.sentiment === 'Bearish' ||
                          item.sentiment === 'Somewhat-Bearish'
                        ? 'bg-red-600/70'
                        : 'bg-gray-600/70'
                  }
                `}
              >
                {item.sentiment} (Score: {item.score.toFixed(2)})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
