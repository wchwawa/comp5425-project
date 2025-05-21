'use client';

import React, { useState } from 'react';
import { ContentDocument } from '@/types/document';
import { motion, AnimatePresence } from 'framer-motion';

interface NewsDisplayProps {
  newsItems: ContentDocument[];
  isLoading: boolean;
  error: string | null;
}

export const NewsDisplay: React.FC<NewsDisplayProps> = ({
  newsItems,
  isLoading,
  error
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-500 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] mb-3"></div>
          <div className="bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent font-medium">
            Loading news articles...
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full rounded-xl overflow-hidden"
      >
        <div className="bg-gray-900/95 px-4 py-3 rounded-xl border border-red-700/50 text-red-300">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-semibold text-sm">Error loading news:</p>
              <p className="text-xs">{error}</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Main structure: Title is always visible if not loading or error
  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      {/* 固定标题部分 */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-md pt-2 pb-3 px-2 border-b border-gray-800/50 shadow-md">
        <motion.h2
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 mb-1"
        >
          Intelligent News
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-xs text-gray-400"
        >
          Retrieve {newsItems ? newsItems.length : 0} articles related to your
          query, the order of news content is based on relevance score.
        </motion.p>
      </div>

      {/* 内容部分 - Scrollable area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 pt-3">
        {!newsItems || newsItems.length === 0 ? (
          // UNIFIED STYLE for no news items - REMOVING BACKGROUND AND BORDER FROM THIS INNER WRAPPER
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="text-center p-4 flex flex-col items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-gray-500 mb-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                {/* News-specific icon */}
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <p className="text-gray-400 text-sm mt-2">
                No news articles found
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Try to input your search query or check back later.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {newsItems.map((item, index) => (
                <NewsCard
                  key={item.source_url || index}
                  item={item}
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      <style jsx global>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 30, 40, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(79, 70, 229, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(79, 70, 229, 0.7);
        }
      `}</style>
    </div>
  );
};

// Individual News Card Component
const NewsCard = ({
  item,
  index
}: {
  item: ContentDocument;
  index: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 p-3 rounded-lg border border-gray-800/70 backdrop-blur-md shadow-lg"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <div className="flex flex-col md:flex-row gap-3">
        {item.imageUrl && (
          <motion.div
            className="md:w-1/4 flex-shrink-0"
            whileHover={{ scale: 1.03 }}
            transition={{ duration: 0.2 }}
          >
            <div className="relative overflow-hidden rounded-md border border-gray-700/60 shadow-md">
              <img
                src={item.imageUrl}
                alt={item.title || 'News image'}
                className="w-full h-24 object-cover transition-transform duration-500"
                style={{
                  transform: isHovered ? 'scale(1.05)' : 'scale(1)'
                }}
                onError={(e) => (e.currentTarget.style.display = 'none')}
              />
            </div>
          </motion.div>
        )}

        <div className={item.imageUrl ? 'md:w-3/4' : 'w-full'}>
          <motion.h3
            whileHover={{ scale: 1.01 }}
            className="text-base font-semibold mb-1.5 line-clamp-1"
          >
            {item.source_url ? (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 hover:from-indigo-300 hover:to-purple-300 transition-all duration-300 hover:underline"
              >
                {item.title || 'Untitled News Article'}
              </a>
            ) : (
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {item.title || 'Untitled News Article'}
              </span>
            )}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0.9 }}
            whileHover={{ opacity: 1 }}
            className="text-sm text-gray-300 mb-2 leading-relaxed line-clamp-2"
          >
            {item.description || item.content || 'No description available.'}
          </motion.p>

          <div className="text-xs text-gray-500 flex justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {item.author && (
                <motion.span
                  whileHover={{ color: '#a5b4fc' }}
                  className="truncate flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="text-gray-400">{item.author}</span>
                </motion.span>
              )}
              {item.upload_time && (
                <motion.span
                  whileHover={{ color: '#a5b4fc' }}
                  className="flex items-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1 text-indigo-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-gray-400">
                    {new Date(item.upload_time).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </motion.span>
              )}
            </div>
            {item.source_type && (
              <motion.span
                whileHover={{
                  scale: 1.05,
                  backgroundColor: 'rgba(79, 70, 229, 0.5)',
                  borderColor: 'rgba(99, 102, 241, 0.7)'
                }}
                transition={{ duration: 0.2 }}
                className="px-2 py-0.5 bg-indigo-900/40 text-indigo-300 rounded-full text-[0.6rem] border border-indigo-800/50"
              >
                {item.source_type.toUpperCase()}
              </motion.span>
            )}
          </div>

          {item.tags && item.tags.length > 0 && (
            <div className="mt-2 pt-1 border-t border-gray-800/50 flex flex-wrap gap-1">
              {item.tags.slice(0, 3).map((tag, i) => (
                <motion.span
                  key={tag}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(79, 70, 229, 0.3)',
                    borderColor: 'rgba(79, 70, 229, 0.5)'
                  }}
                  transition={{ duration: 0.2 }}
                  className="px-1.5 py-0.5 bg-gray-800/80 text-gray-300 text-xs rounded-full border border-gray-700/60"
                >
                  {tag}
                </motion.span>
              ))}
              {item.tags.length > 3 && (
                <span className="text-xs text-gray-400 self-center">
                  +{item.tags.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
};

// If this component should be the default export or you have other exports:
// export default NewsDisplay;
// For now, named export is fine as per standard practice.
