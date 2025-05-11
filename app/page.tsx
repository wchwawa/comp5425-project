import { QueryBox } from '@/components/queryBox/QueryBox';

export default function Page() {
  return (
    <div className="min-h-screen text-gray-100">
      <div className="container mx-auto px-4 py-9">
        <header className="mb-8">
          <h1 className="text-5xl font-extrabold text-center w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text">
            Stock Market Podcast & News Explorer
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Search and discover podcasts with AI-powered insights
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <QueryBox />
        </div>
        
        {/* <div className="center mt-10">
          <h1 className="text-xl font-semibold text-center w-full bg-gradient-to-r from-red-400 to-yellow-300 text-transparent bg-clip-text">
            Admin only
          </h1>

          <div className="flex justify-center mt-3">
            <IndexingTrigger />
          </div>
        </div> */}
      </div>
    </div>
  );
}
