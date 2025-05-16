'use client';

import { useState } from 'react';
import { ContentDocument } from '@/types/document';
import { PodcastCard } from '@/components/Card/PodCastCard';
import ResizableChart from '@/components/ui/tradingview-widget/ResizableChart';
import { NewsDisplay } from '@/components/NewsDisplay/NewsDisplay';
import { motion } from 'framer-motion';

export const QueryBox = () => {
  const [query, setQuery] = useState('');
  const [podcastDocuments, setPodcastDocuments] = useState<ContentDocument[]>(
    []
  );
  const [chartSymbol, setChartSymbol] = useState<string[][]>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newsItems, setNewsItems] = useState<ContentDocument[]>([]);
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
      // The newsData.news should now be an array of ContentDocument
      if (newsData.news) {
        setNewsItems(newsData.news); // Directly set the ContentDocument[]
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
    <div className="flex flex-col min-h-screen w-full text-white pb-6">
      {/* Search Bar - Moved to the top */}
      <div className="p-3 backdrop-blur-md shadow-md w-full sticky top-0 z-50">
        <div className="flex gap-2 max-w-5xl mx-auto">
          <input
            type="text"
            placeholder="what's in your mind..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-grow px-4 py-2 bg-black/40 text-white border border-gray-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent placeholder-gray-400"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={isLoading}
            className="px-6 py-2 bg-indigo-700/80 text-white rounded-md hover:bg-indigo-600/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors duration-200 whitespace-nowrap backdrop-blur-sm"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Content Area - Full width, flex layout with fixed height and bottom padding */}
      <div className="flex flex-grow overflow-hidden p-4 md:p-6 gap-4 md:gap-6 h-[calc(100vh-84px)] mb-5">
        {/* Left Column (Podcast) - Takes full height */}
        <div className="w-3/5 flex flex-col space-y-4 h-full">
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

          {/* 固定标题部分 for Podcast List - Inspired by NewsDisplay */}
          <div className="sticky top-0 z-20 backdrop-blur-md  pt-2 pb-3 px-2 rounded-xl shadow-md">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 mb-1"
            >
              Intelligent Podcast
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="text-sm text-gray-400"
            >
              {isLoading && !podcastDocuments.length
                ? 'Searching for podcasts...'
                : podcastDocuments.length > 0
                  ? `Found ${podcastDocuments.length} podcast episodes related to your query.`
                  : 'Enter your query to discover podcasts.'}
            </motion.p>
          </div>

          {/* Podcast Display Area - Make sure this scrollable container is below the sticky header */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pt-1">
            {' '}
            {/* Added pt-1 to avoid overlap with sticky header */}
            {isLoading && !podcastDocuments.length ? (
              // loading animation
              <div className="flex flex-col items-center justify-center h-full backdrop-blur-md bg-black/30 rounded-xl border border-gray-800/50 w-full">
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
                className="space-y-3 w-full pb-6"
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
              // initial state - prompt - UNIFIED STYLE
              <div className="flex flex-col items-center justify-center h-full text-center py-12 backdrop-blur-md bg-black/30 rounded-xl border border-gray-800/50 w-full p-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-gray-500 mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  {/* Podcast-specific icon (Microphone) */}
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <p className="text-gray-400 text-sm mt-2">No podcasts found</p>
                <p className="text-xs text-gray-500 mt-1">
                  Try a different search query to discover podcasts.
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Right Column (News & Chart) - Two stacked cells with flexible heights */}
        <div className="w-2/5 flex flex-col space-y-4 h-full">
          {/* Resizable TradingView Chart Widget */}
          <div className="flex-shrink-0">
            <ResizableChart
              stockSymbols={chartSymbol || []}
              initialHeight={250}
            />
          </div>

          {/* News Display Area - Takes remaining height */}
          <div className="flex-grow backdrop-blur-md bg-black/30 p-2 pb-4 rounded-xl border border-gray-800/50 shadow-md flex flex-col mb-2 overflow-hidden">
            <div className="flex-grow overflow-hidden">
              <NewsDisplay
                newsItems={newsItems}
                isLoading={isNewsLoading}
                error={newsError}
              />
            </div>
          </div>
        </div>
      </div>

      {/* add CSS animations and custom scrollbar */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(129, 140, 248, 0.6); /* Indigo-ish */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.8); /* Darker Indigo-ish */
        }
        /* 移除阻止滚动的样式 */
        /* body {
          overflow: hidden; 
        } */

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
