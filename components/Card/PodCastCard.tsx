import { ContentDocument } from '@/types/document';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PodcastCardProps {
  podcast: ContentDocument;
  query?: string;
}

export const PodcastCard = ({ podcast, query }: PodcastCardProps) => {
  // state: is description expanded
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const {
    title = 'untitled podcast',
    imageUrl,
    source_url,
    source_type,
    tags = [],
    aiSummary,
    description,
    author,
    upload_time
  } = podcast;

  // check if the url is mphe url is mp3
  const isMp3Url = source_url?.toLowerCase().includes('.mp3');

  //  handle
  const descriptionLimit = 300;
  const hasLongDescription =
    description && description.length > descriptionLimit;
  const displayDescription =
    isDescriptionExpanded || !hasLongDescription
      ? description
      : description?.slice(0, descriptionLimit) + '...';

  // Format date if available
  const formattedDate = upload_time
    ? new Date(upload_time).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col md:flex-row rounded-xl overflow-hidden backdrop-blur-md bg-gray-900/80 border border-gray-800/70 shadow-lg hover:shadow-xl transition-shadow"
    >
      {/* leftside: podcast player */}
      <div className="w-full md:w-2/5 bg-gray-950/90 p-4 flex flex-col">
        {/* thumbnails */}
        <motion.div
          whileHover={{ scale: 1.03, filter: 'brightness(1.1)' }}
          transition={{ duration: 0.2 }}
          className="relative w-full aspect-square md:aspect-square bg-gray-800/80 rounded-lg overflow-hidden mb-4"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800/90 to-gray-900/90">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M19 9l-7 7-7-7"
                />
                <circle
                  cx="12"
                  cy="9"
                  r="7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 15v4M8 9h8"
                />
              </svg>
            </div>
          )}
        </motion.div>

        {/* Title and category */}
        <div className="mb-2 md:mb-3">
          <div className="flex items-center gap-2">
            <motion.h3
              whileHover={{ scale: 1.02, color: '#a5b4fc' }}
              transition={{ duration: 0.2 }}
              className="text-lg md:text-xl font-bold text-white line-clamp-1"
            >
              {title}
            </motion.h3>
            {source_type && (
              <motion.span
                whileHover={{
                  scale: 1.05,
                  backgroundColor: 'rgba(79, 70, 229, 0.5)',
                  borderColor: 'rgba(99, 102, 241, 0.7)'
                }}
                transition={{ duration: 0.2 }}
                className="px-2 py-1 text-xs rounded-full bg-indigo-900/70 text-indigo-300 border border-indigo-800/60"
              >
                {source_type}
              </motion.span>
            )}
          </div>
        </div>

        {/* Author and upload time */}
        <div className="mb-3 md:mb-4 text-sm">
          {author && (
            <div className="flex items-center text-gray-400 mb-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5"
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
              <span>{author}</span>
            </div>
          )}

          {formattedDate && (
            <div className="flex items-center text-gray-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1.5"
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
              <span>{formattedDate}</span>
            </div>
          )}
        </div>

        {/* mp3 player */}
        {isMp3Url && (
          <div className="mt-auto">
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <audio
                controls
                className="w-full border-none outline-none"
                style={{
                  backgroundColor: 'transparent',
                  colorScheme: 'dark',
                  boxShadow: 'none'
                }}
              >
                <source src={source_url} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </motion.div>
          </div>
        )}

        {/* if not mp3 but has source url, show link */}
        {!isMp3Url && source_url && (
          <motion.a
            whileHover={{
              scale: 1.05,
              backgroundColor: 'rgba(79, 70, 229, 0.8)'
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
            href={source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto text-center py-2 px-4 bg-indigo-700/90 hover:bg-indigo-600/90 text-white rounded-lg transition-colors backdrop-blur-sm"
          >
            source url
          </motion.a>
        )}
      </div>

      {/* rightside: tags, ai summary and description */}
      <div className="w-full md:w-3/5 p-4 flex flex-col space-y-4">
        {/* tags */}
        {tags && tags.length > 0 && (
          <div className="md:block">
            <div className="text-xs uppercase text-gray-400 font-semibold mb-2 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              tag
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((tag, index) => (
                <motion.span
                  key={index}
                  whileHover={{
                    scale: 1.05,
                    backgroundColor: 'rgba(79, 70, 229, 0.3)',
                    borderColor: 'rgba(79, 70, 229, 0.5)'
                  }}
                  transition={{ duration: 0.2 }}
                  className="px-2 py-1 text-xs rounded-full bg-gray-800/80 text-gray-300 border border-gray-700/60"
                >
                  {tag}
                </motion.span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-gray-400 self-center hidden md:inline-block">
                  +{tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* AI Analysis Section with Animated Border */}
        {aiSummary && (
          <div>
            <motion.div
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="ai-analysis-container relative p-[2px] rounded-lg overflow-hidden"
            >
              {/* Animated gradient border effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-500 to-indigo-600 rounded-lg animate-border-flow"></div>

              {/* Solid background content container */}
              <div className="relative rounded-lg bg-gray-900/95 p-2 md:p-4 h-full z-10">
                {/* AI icon with pulse effect */}
                <div className="absolute top-2 md:top-3 right-2 md:right-3">
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-indigo-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    {/* <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div> */}
                  </div>
                </div>

                {/* Title with gradient text */}
                <div className="mb-2 md:mb-3 pb-1 md:pb-2 border-b border-gray-800/50">
                  <h4 className="text-xs md:text-sm font-semibold uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400">
                    AI Analysis{' '}
                  </h4>
                </div>

                {/* Content */}
                <div className="text-gray-300 text-sm md:text-base line-clamp-3 md:line-clamp-none">
                  {aiSummary}
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Podcast Description */}
        {description && (
          <div className="block">
            <div className="text-xs uppercase text-gray-400 font-semibold mb-2 flex items-center justify-between">
              <div className="flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="md:inline">PodCast Description</span>
                <span className="inline md:hidden">Description</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05, color: '#a5b4fc' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center transition-colors focus:outline-none md:hidden"
              >
                {isDescriptionExpanded ? (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                    <span>Collapse</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <span>Expand</span>
                  </>
                )}
              </motion.button>
            </div>
            <div>
              <div className="text-gray-300 overflow-hidden">
                <AnimatePresence>
                  {!isDescriptionExpanded ? (
                    <motion.div
                      initial={{ height: 'auto' }}
                      exit={{ height: 0, opacity: 0 }}
                      className="line-clamp-1 md:line-clamp-none text-sm md:text-base"
                    >
                      <p>{description}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-sm md:text-base"
                    >
                      <p>{description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {hasLongDescription && (
                <motion.button
                  whileHover={{ scale: 1.05, color: '#a5b4fc' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="mt-1 text-xs text-indigo-400 hover:text-indigo-300 flex items-center transition-colors focus:outline-none hidden md:flex"
                >
                  {isDescriptionExpanded ? (
                    <>
                      Collapse
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </>
                  ) : (
                    <>
                      Expand
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3 w-3 ml-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </div>
        )}

        {/* Custom styles for animations */}
        <style jsx global>{`
          @keyframes border-flow {
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

          .animate-border-flow {
            background-size: 300% 300%;
            animation: border-flow 3s ease infinite;
          }

          .ai-analysis-container:hover .animate-border-flow {
            animation-duration: 2s;
          }
        `}</style>
      </div>
    </motion.div>
  );
};
