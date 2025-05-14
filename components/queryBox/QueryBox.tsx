'use client';

import { useState } from 'react';
import { ContentDocument } from '@/types/document';
import { PodcastCard } from '@/components/Card/PodCastCard';
import TradingViewSymbolOverviewChart from '@/components/ui/tradingview-widget/TradingViewSimpleChartWidget';
import { NewsDisplay, ProcessedNewsItem } from '@/components/NewsDisplay';

export const QueryBox = () => {
  const [query, setQuery] = useState('');
  const [podcastDocuments, setPodcastDocuments] = useState<ContentDocument[]>(
    []
  );
  const [chartSymbol, setChartSymbol] = useState<string[][]>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newsItems, setNewsItems] = useState<ProcessedNewsItem[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  const handleSearch = async () => {
    console.log('handleSearch called with query:', query);
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setPodcastDocuments([]);

    setIsNewsLoading(true);
    setNewsError(null);
    setNewsItems([]);

    //fetch podcast documents
    try {
      const response = await fetch('/api/fetchPodcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      console.log('podcast response=====================', response);

      if (!response.ok) {
        throw new Error('Search failed, please try again later');
      }

      const data = await response.json();
      setPodcastDocuments(data.podcastDocuments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'invalid error');
      console.error('Error during /api/fetchPodcast:', err);
    } finally {
      // setIsLoading for podcast and chart symbol will be handled after all primary fetches
    }

    //fetch trading view simple chart symbol
    console.log(
      'Preparing to fetch /api/fetchSimpleChartSymbol for query:',
      query
    );
    try {
      const response = await fetch('/api/fetchSimpleChartSymbol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) {
        throw new Error(
          'Symbol for chart retrive failed, please try again later'
        );
      }

      const data = await response.json();
      const symbols: string[][] = data.stockSymbols;
      console.log(
        'FROM API (fetchSimpleChartSymbol) =====================',
        symbols
      );
      setChartSymbol(symbols);
      console.log('chart symbol state', chartSymbol);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'invalid error');
      console.error('Search error:', err);
    } finally {
      setIsLoading(false); // Combined loading state for podcast and chart
    }

    //fetch alphavantage news & sentiment
    console.log(
      'Preparing to fetch /api/fetchAlphavantageNews for query:',
      query
    );
    try {
      const newsResponse = await fetch('/api/fetchAlphavantageNews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!newsResponse.ok) {
        const errorData = await newsResponse.json();
        throw new Error(
          errorData.error || 'News fetching failed, please try again later'
        );
      }

      const newsData = await newsResponse.json();
      // The newsData.news should now be an array of ProcessedNewsItem from the server
      if (newsData.news) {
        setNewsItems(newsData.news); // Directly set the processed news
      } else {
        setNewsItems([]);
      }
    } catch (err) {
      setNewsError(err instanceof Error ? err.message : 'Failed to fetch news');
      console.error('Error during /api/fetchAlphavantageNews:', err);
    } finally {
      setIsNewsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mt-8">
      <div className="space-y-6 w-full">
        {/* search abr */}
        <div className="backdrop-blur-md bg-black/30 p-4 rounded-xl border border-gray-800/50 shadow-md w-full">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="what's in your mind..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow px-4 py-3 bg-black/40 text-white border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isLoading}
              className="px-6 py-3 bg-indigo-700/80 text-white rounded-md hover:bg-indigo-600/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200 whitespace-nowrap backdrop-blur-sm"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
        {/* error msg */}
        {error && (
          <div className="py-3 px-4 bg-red-900/30 border border-red-800/50 text-red-300 rounded-xl backdrop-blur-md w-full">
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          </div>
        )}
        {/* podcast display area */}
        <div className="w-full">
          {isLoading ? (
            // loading animation
            <div className="flex flex-col items-center justify-center py-16 backdrop-blur-md bg-black/30 rounded-xl border border-gray-800/50 w-full">
              <div className="relative w-20 h-20">
                {/* loading spinning animation */}
                <div className="absolute inset-0 rounded-full border-t-2 border-b-2 border-indigo-500 animate-spin"></div>
                <div className="absolute inset-2 rounded-full border-2 border-purple-500 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-3 h-3 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full"></div>
                </div>
              </div>
              <p className="mt-4 text-gray-300 font-medium">
                Processing your query...
              </p>
              <p className="text-sm text-gray-400">
                Searching podcast content for "{query}"
              </p>
            </div>
          ) : podcastDocuments.length > 0 ? (
            // search results - using PodcastCard
            <div
              className="space-y-6 w-full transition-all"
              style={{
                opacity: 1,
                animation: 'fadeIn 0.5s ease-out'
              }}
            >
              {podcastDocuments.map((podcast, index) => (
                <div
                  key={index}
                  className="transform transition-all duration-300 hover:translate-x-1 w-full"
                  style={{
                    animationDelay: `${index * 150}ms`,
                    animation: 'slideIn 0.5s ease-out forwards'
                  }}
                >
                  <PodcastCard podcast={podcast} query={query} />
                </div>
              ))}
            </div>
          ) : (
            // initial state - prompt
            <div className="text-center py-12 backdrop-blur-md bg-black/30 rounded-xl border border-gray-800/50 w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-indigo-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-gray-300 text-lg">input keyword</p>
            </div>
          )}
        </div>
        {/* TradingView Chart Widget */}
        <div className="w-full backdrop-blur-md bg-black/30 p-4 rounded-xl border border-gray-800/50 shadow-md">
          <h3 className="text-lg font-medium text-gray-200 mb-3">
            Intelligent chart
          </h3>
          <TradingViewSymbolOverviewChart stockSymbols={chartSymbol || []} />
        </div>

        {/* News Display Area */}
        <NewsDisplay
          newsItems={newsItems}
          isLoading={isNewsLoading}
          error={newsError}
        />
      </div>

      {/* add CSS animations */}
      <style jsx global>{`
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes soundWave {
          0%,
          100% {
            height: 4px;
          }
          50% {
            height: 16px;
          }
        }
      `}</style>
    </div>
  );
};
